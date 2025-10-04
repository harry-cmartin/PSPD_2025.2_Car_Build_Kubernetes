const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDef = protoLoader.loadSync("protos/pricing.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: ["protos"],
});
const proto = grpc.loadPackageDefinition(packageDef).pricing;

const calcularPrecoTotal = (itens) => {
  let precoTotal = 0;
  let frete = 0;

  const chassiCount = itens
    .filter((item) => item.peca.nome.toLowerCase().includes("chassi"))
    .reduce((total, item) => total + item.quantidade, 0);

  if (chassiCount > 1) {
    throw new Error("Somente um chassi é permitido por pedido");
  }

  itens.forEach((item) => {
    const valorItem = item.peca.valor * item.quantidade;
    precoTotal += valorItem;

    // botar frete se quiser
  });

  return { precoTotal };
};

const pricingService = {
  Calcular: (call, callback) => {
    try {
      const { itens } = call.request;

      console.log(
        `[SERVER B] Calculando preço para ${itens.length} tipos de itens`
      );

      itens.forEach((item, index) => {
        console.log(
          `[SERVER B] Item ${index + 1}: ${item.peca.nome} (ID: ${
            item.peca.id
          }) - Qtd: ${item.quantidade} - Valor unitário: R$ ${item.peca.valor}`
        );
      });

      const { precoTotal } = calcularPrecoTotal(itens);

      const response = {
        preco: precoTotal,
      };

      console.log(
        `[SERVER B] Preço calculado - Subtotal: R$ ${precoTotal.toFixed(2)}`
      );

      callback(null, response);
    } catch (error) {
      console.error(`[SERVER B] Erro ao calcular preço: ${error.message}`);

      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: error.message,
      });
    }
  },
};

const server = new grpc.Server();
server.addService(proto.OrcamentoService.service, pricingService);

const serverAddress = "0.0.0.0:50052";
server.bindAsync(
  serverAddress,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Erro ao iniciar servidor B:", err);
      return;
    }

    console.log(
      `[SERVER B] Microserviço B (Pricing) rodando em ${serverAddress}`
    );
    server.start();
  }
);
