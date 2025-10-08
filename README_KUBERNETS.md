### **Primeiro instala o Kubernetes, varia de sistema pra sistema, por isso coloquei a documentação**

> https://kubernetes.io/docs/tasks/tools/

### **Depois, instala o minikube**

> https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Farm64%2Fstable%2Fbinary+download

### **1. Inicializar o minikube**

Quando tiver instalado tudo, rode o minikube:

```bash
minikube start
```

### **2. Dashboard (opcional)**

Para acompanhar os serviços rodando, use o comando:

```bash
minikube dashboard
```

### **3. Build das imagens Docker**

Construa manualmente as três imagens necessárias para o Kubernetes:

```bash
# Navegar para o diretório do projeto
cd Car_Build

# 1. Build da imagem do Server A
docker build -f ./Microservices/serverA-microsservice/Dockerfile -t car_build-server-a:latest .

# 2. Build da imagem do Server B
docker build -f ./Microservices/serverB-microsservice/Dockerfile -t car_build-server-b:latest .

# 3. Build da imagem do P-API
docker build -f ./P-Api/Dockerfile -t car_build-p-api:latest ./P-Api
```

### **4. Carregar imagens no minikube**

Depois que já tiver as imagens, rode o comando para carregar as imagens no minikube, não precisa ta com o docker rodando, só precisava das imagens:

```bash
minikube image load car_build-p-api:latest
minikube image load car_build-server-a:latest
minikube image load car_build-server-b:latest
```

### **5. Aplicar os manifests**

Depois, entre na pasta `/manifests` e rode o comando para dar apply no Kubernetes:

```bash
cd manifests
kubectl apply -f .
```

### **6. Verificar deployments**

Deve demorar um pouco para subir o banco, mas confirma com os comandos:

```bash
kubectl get deployments
kubectl get pods
```

### **7. Expor o serviço com Minikube Tunnel**

**Criar túnel (manter rodando em background):**
```bash
minikube tunnel
```

**Verificar se funcionou:**
```bash
kubectl get service p-api-service

# Deve mostrar algo como:
# NAME            TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
# p-api-service   LoadBalancer   10.96.X.X      localhost     8000:XXX   1m
```

> **Resultado**: P-API sempre disponível em `http://localhost:8000`

### **8. Iniciar o frontend**

O frontend usa URL fixa configurada:
```bash
cd WebClient
npm start
```

---

## **Conformidade com Especificação**

Esta implementação atende perfeitamente aos requisitos definidos inicialmente:

- **HServ**: Kubernetes cluster (minikube)
- **HClient**: Browser com frontend React
- **Container P**: API Gateway (HTTP ↔ gRPC)
- **Container A**: Microserviço catálogo gRPC
- **Container B**: Microserviço pricing gRPC
- **Rede Externa**: HTTP tradicional via NodePort
- **Rede Interna**: HTTP/2 gRPC entre containers
- **Persistência**: PostgreSQL com PVC

## **Resultado Esperado**

- **Backend**: Disponível via túnel do minikube
- **Frontend**: http://localhost:3000
- **Dashboard**: `minikube dashboard` para monitoramento
