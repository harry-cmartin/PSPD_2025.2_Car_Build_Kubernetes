### **Primeiro instala o Kubernetes, varia de sistema pra sistema, por isso coloquei a documentação**
>  https://kubernetes.io/docs/tasks/tools/

### **Depois, instala o minikube**
>  https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Farm64%2Fstable%2Fbinary+download

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
Para facilitar, rode o docker-compose, que já irá gerar as imagens necessárias pro Kubernetes:
```bash
docker-compose up --build
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

### **7. Expor o serviço**
Por fim, para rodar de fato o minikube, rode:
```bash
minikube service p-api-service
```

### **8. Iniciar o frontend**
Daí, rode o npm start, e pronto:
```bash
cd WebClient
npm start
```

---

## **Resultado Esperado**

- **Backend**: Disponível via túnel do minikube
- **Frontend**: http://localhost:3000
- **Dashboard**: `minikube dashboard` para monitoramento