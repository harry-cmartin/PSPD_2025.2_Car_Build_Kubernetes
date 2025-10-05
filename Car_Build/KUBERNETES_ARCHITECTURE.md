# Arquitetura Kubernetes

Nesta aplicação, utilizamos o Minikube, uma ferramenta que cria e gerencia um cluster Kubernetes completo, porém simplificado, que roda localmente na máquina.

O diferencial do Minikube, é que ele é um cluster que o Minikube cria é um cluster de nó único (host unico), enquanto um cluster de produção geralmente é composto por múltiplos nós (computadores)

## Componentes e Manifestos

### **1. Camada de Dados (PostgreSQL)**

#### `postgres-pvc.yaml` - Armazenamento Persistente
```yaml
kind: PersistentVolumeClaim
```
**Função**: Reserva 1GB de disco persistente no cluster
- **Por que?**: Dados do PostgreSQL precisam sobreviver a reinicializações
- **Comportamento**: Mesmo se o pod morrer, os dados permanecem salvos

#### `postgres-configmap.yaml` - Script de Inicialização  
```yaml
kind: ConfigMap
data:
  init.sql: |
    CREATE TABLE carros...
    CREATE TABLE pecas...
```
**Função**: Armazena o script SQL que cria tabelas e popula dados
- **Execução**: Roda automaticamente na primeira inicialização do PostgreSQL
- **Conteúdo**: Tabelas `carros` e `pecas` + dados iniciais (Fusca, Civic, Corolla)

#### `postgres-deployment.yaml` - Container do Banco
```yaml
kind: Deployment
image: postgres:15-alpine
```
**Função**: Executa o PostgreSQL no cluster
- **Volumes**: Conecta PVC criado (dados) + ConfigMap (script SQL)
- **Ambiente**: Define as variáveis de ambiente do banco. Essas credenciais são utilizadas tanto pelo contêiner do banco quanto pelos serviços que irão se conectar a ele.
- **Porta**: 5432 (exposta internamente no cluster para acesso pelas aplicações).

#### `postgres-service.yaml` - Rede Interna do Banco
```yaml
kind: Service
type: ClusterIP
```
**Função**: Cria um serviço interno para expor o PostgreSQL dentro do cluster.
- **DNS interno**: Gera automaticamente o nome `postgres-service`, que pode ser usado por outros Pods para se conectar ao banco sem precisar do IP direto.
- **Acesso**: Direciona o tráfego recebido na porta 5432 para os Pods do Deployment do PostgreSQL.
- **Isolamento**: Por ser do tipo ClusterIP, o serviço só é acessível de dentro do cluster, garantindo que o banco não fique exposto externamente.

---

### **2. Camada de Microserviços (Containers A & B)**

#### `server-a-deployment.yaml` - Microserviço de Catálogo
```yaml
kind: Deployment
image: car_build-server-a:latest
env:
  - name: DB_HOST
    value: "postgres-service"
```
**Função**: Container A - Microserviço gRPC de catálogo
- **Responsabilidade**: Buscar peças por modelo de carro
- **Tecnologia**: Node.js + gRPC
- **Banco**: Conecta no PostgreSQL via DNS interno
- **Porta**: 50051 (gRPC)

#### `server-a-service.yaml` - DNS do Catálogo
```yaml
kind: Service
type: ClusterIP
```
**Função**: Cria DNS `server-a-service` para acesso interno

#### `server-b-deployment.yaml` - Microserviço de Pricing
```yaml
kind: Deployment  
image: car_build-server-b:latest
```
**Função**: Container B - Microserviço gRPC de cálculo de preços
- **Responsabilidade**: Calcular preços totais dos orçamentos
- **Tecnologia**: Node.js + gRPC  
- **Porta**: 50052 (gRPC)

#### `server-b-service.yaml` - DNS do Pricing
```yaml
kind: Service
type: ClusterIP
```
**Função**: Cria DNS `server-b-service` para acesso interno

---

### **3. Camada de API Gateway (Container P)**

#### `p-api-deployment.yaml` - API Gateway
```yaml
kind: Deployment
image: car_build-p-api:latest
env:
  - name: SERVER_A_HOST
    value: "server-a-service"
  - name: SERVER_B_HOST  
    value: "server-b-service"
```
**Função**: Executa o API Gateway (Container P), que serve como ponte entre o frontend e os serviços internos.
- **Rede Externa**: Recebe requisições HTTP do frontend
- **Rede Interna**: Converte para gRPC e chama Server A/B
- **Ambiente**: Define variáveis (`SERVER_A_HOST` e `SERVER_B_HOST`) que apontam para os serviços internos no cluster, garantindo que o Gateway saiba como se comunicar com eles via DNS do Kubernetes.
- **Tecnologia**: Construído em FastAPI com clientes gRPC para orquestrar as chamadas.
- **CORS**: Configurado para permitir que o frontend (mesmo rodando em localhost) consiga acessar a API sem bloqueios de navegador.

#### `p-api-service.yaml` - Exposição Externa
```yaml
kind: Service
type: NodePort
```
**Função**: **ÚNICA** Torna o API Gateway acessível de fora do cluster.
- **Tipo**: NodePort abre uma porta no nó do cluster, permitindo que usuários externos (como o frontend) façam requisições HTTP.
- **Comando**: `minikube service p-api-service` cria túnel
- **Resultado**: O frontend pode se conectar ao cluster chamando o Gateway diretamente, sem precisar conhecer os serviços internos.

---

## **Fluxo Completo de uma Requisição**

### **1. Buscar Peças de um Carro:**

```
1. [Frontend React] 
   POST http://127.0.0.1:57153/get-pecas
   Body: {"modelo": "fusca", "ano": 2014}
   ↓
   
2. [minikube tunnel] 
   Encaminha para cluster Kubernetes
   ↓
   
3. [p-api-service NodePort] 
   DNS resolve para pod p-api-deployment
   ↓
   
4. [Container P - FastAPI] 
   - Recebe HTTP POST
   - Converte para gRPC
   - Chama server-a-service via DNS interno
   ↓
   
5. [Container A - Server gRPC] 
   - Recebe gRPC GetPecas()
   - Conecta postgres-service via DNS
   - Query SQL: SELECT * FROM pecas WHERE modelo_fk = 'fusca'
   ↓
   
6. [PostgreSQL] 
   - Busca dados no PVC persistente  
   - Retorna: Chassi R$5000, Motor 1.6 R$3500, etc.
   ↓
   
7. [Resposta volta pelo caminho inverso]
   PostgreSQL → Server A → P-API → Tunnel → Frontend
```

### **2. Calcular Preço Total:**

```
1. [Frontend] Envia peças selecionadas para /calcular
2. [Container P] Converte HTTP → gRPC 
3. [Container B] Recebe lista de peças e quantidades
4. [Container B] Calcula: (quantidade × valor) para cada peça
5. [Resposta] Preço total retorna para frontend
```

---

## **Tipos de Services e Redes**

| Service | Tipo | Acesso | Função |
|---------|------|--------|---------|
| `postgres-service` | ClusterIP | Apenas interno | DNS do banco |
| `server-a-service` | ClusterIP | Apenas interno | DNS do catálogo |  
| `server-b-service` | ClusterIP | Apenas interno | DNS do pricing |
| `p-api-service` | **NodePort** | **Externo** | **Gateway público** |

### **Redes Configuradas:**
- **Rede Externa**: Frontend ↔ P-API (HTTP tradicional)
- **Rede Interna**: P-API ↔ Server A/B (HTTP/2 gRPC)

---


### **Comandos:**
```bash
# 1. Subir minikube
minikube start

# 2. Carregar imagens
minikube image load car_build-p-api:latest
minikube image load car_build-server-a:latest  
minikube image load car_build-server-b:latest

# 3. Deploy todos os manifests
kubectl apply -f .

# 4. Aguardar pods iniciarem
kubectl get pods -w

# 5. Expor P-API externalmente
minikube service p-api-service

# 6. Executar frontend
npm start
```

---

## **Verificação e Monitoramento**

### **Comandos Úteis:**
```bash
# Ver status dos pods
kubectl get pods

# Ver logs de um serviço
kubectl logs -f deployment/p-api-deployment
kubectl logs -f deployment/server-a-deployment

# Testar conectividade interna
kubectl exec -it deployment/postgres-deployment -- psql -U car_build_user -d car_build_db

# Dashboard visual
minikube dashboard
```

## **Conformidade com Especificação**

Esta implementação atende perfeitamente aos requisitos:

- **HServ**: Kubernetes cluster (minikube)
- **HClient**: Browser com frontend React  
- **Container P**: API Gateway (HTTP ↔ gRPC)
- **Container A**: Microserviço catálogo gRPC
- **Container B**: Microserviço pricing gRPC
- **Rede Externa**: HTTP tradicional via NodePort
- **Rede Interna**: HTTP/2 gRPC entre containers
- **Persistência**: PostgreSQL com PVC
