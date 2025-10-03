### 

1 - Clica no carro que quer no WEB CLIENTE, envia um HTTP para o P, o P converte esse http em formato que seja compreensivel para protobuf e envia proa A a requisicao (o modelo escolhido pelo usuario) 

2 - SERVER A -> Pega o modelo enviado por P Retorna para P todas as pecas disponiveis para aquele modelo 

3 - P pega o retorno de A em protobuf e transforma em http e retorna para o web client(usuario) as pecas todas as pecas disponiveis para o modelo escolhido

4 - O usuario escolhe as pecas que quer (Limitar a quantidade por peça EXEMPLO: SOMENTE UM CHASSI É POSSIVEL DE SER ESCOLHIDO) selecionando-as, a medida que for selecionando vai enviando para P, P transforma esse HTTP em protobuf e envia pra o microservico B que calcula o preço em tempo real, e retorna para o P que tranforma Protobuf em Http e retorna o preco para o Webclient em tempo real

5 - O cliente clica em comprar, envia um Http para o P e P envia novamente para B somente uma tag "realizar_Compra" , ai B gera um ID do pedido e demais infos necessarias e entao retorna pra P que traz devolta para o webclient que entao mostra uma tela unica com o Id do pedido e informacoes da compra



## OQ AINDA PODE BOTAR PRA MELHORAR


1)
Se precisar de ter todos os tipos de comunicacao pode colocar o tempo real de atualizar os precos como server streaming, esta unario, vai ter de gerar  bagulho tudo denovo

service OrcamentoService {
    rpc CalcularRealTime (OrcamentoRequest) returns (stream Preco);
}

2) Implementar banco de dados no microservice A, pode ser qualquer um, acho que um postgres é bom pra ficar o bem bolado com docker pro kubernetes

3) Implementar o Frete na funcao calcularPrecoTotal do micro B e colocar a logica la no frontt onde aparece o total final

4) Implementar o Topico 5 acima, acho que tem que passar o valor e os produtos selecionados pro endpoint comentado la em app.py pra o B poder gerar o relatorio da compra e tal e voltar o ID da compra, pode implementar de outra forma ai que ces acharem melhor (IMPLEMENTAR O FRONT TAMBEM, BOTA UMA PAGINA UNICA SO PRA ESSE RELATORIO DA COMPRA)

## FALTA AINDA

1) Dockerfiles e docker compose

2) Kubernetes, nao faco ideia de como fazer

3) relatorio do item C do aprende

4) implementar tudo so com http e rest

5) comparacoes de velocidade , sla como faz

6) tem de fazer slides

7) Fazer item B.1 do PDF do professor https://github.com/chelseafarley/PythonGrpc 