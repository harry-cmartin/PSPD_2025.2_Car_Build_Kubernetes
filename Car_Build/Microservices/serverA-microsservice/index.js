
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync(
  '../../protos/catalogo.proto',
  { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true, includeDirs: ['../../protos'] }
);
const proto = grpc.loadPackageDefinition(packageDef).catalogo;

const carros = [
  {"modelo": "fusca", "ano": 2014}, 
  {"modelo": "civic", "ano": 2023},
  {"modelo": "corolla", "ano": 2020}
];

const pecas = [

  {"id": "1", "nome": "Chassi", "valor": 5000.00, "modelo_fk": "fusca"},
  {"id": "2", "nome": "Motor 1.6", "valor": 3500.00, "modelo_fk": "fusca"},
  {"id": "3", "nome": "Rodas Aro 14", "valor": 800.00, "modelo_fk": "fusca"},
  {"id": "4", "nome": "Farol Dianteiro", "valor": 150.00, "modelo_fk": "fusca"},
  
  {"id": "5", "nome": "Chassi", "valor": 8000.00, "modelo_fk": "civic"},
  {"id": "6", "nome": "Motor 2.0 VTEC", "valor": 6500.00, "modelo_fk": "civic"},
  {"id": "7", "nome": "Rodas Aro 16", "valor": 1200.00, "modelo_fk": "civic"},
  {"id": "8", "nome": "Farol LED", "valor": 350.00, "modelo_fk": "civic"},
  
  {"id": "9", "nome": "Chassi", "valor": 7500.00, "modelo_fk": "corolla"},
  {"id": "10", "nome": "Motor 1.8 Hybrid", "valor": 7000.00, "modelo_fk": "corolla"},
  {"id": "11", "nome": "Rodas Aro 15", "valor": 900.00, "modelo_fk": "corolla"},
  {"id": "12", "nome": "Farol Xenon", "valor": 280.00, "modelo_fk": "corolla"}
];


const catalogoService = {
  GetPecas: (call, callback) => {
    const { modelo, ano } = call.request;
    
    console.log(`[SERVER A] Recebida requisição para modelo: ${modelo}, ano: ${ano}`);
    
    const pecasDoModelo = pecas
      .filter(peca => peca.modelo_fk.toLowerCase() === modelo.toLowerCase())
      .map(peca => ({
        id: peca.id,
        nome: peca.nome,
        valor: peca.valor
      }));
    
    const response = {
      pecas: pecasDoModelo
    };
    
    console.log(`[SERVER A] Retornando ${pecasDoModelo.length} peças para ${modelo}`);
    callback(null, response);
  }
};


const server = new grpc.Server();
server.addService(proto.CatalogoService.service, catalogoService);

const serverAddress = '0.0.0.0:50051';
server.bindAsync(serverAddress, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Erro ao iniciar servidor:', err);
    return;
  }
  
  console.log(`[SERVER A] Microserviço A (Catálogo) rodando em ${serverAddress}`);
  server.start();
});


