
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.protobuf import json_format
import grpc
import generated.catalogo_pb2 as catalogo_pb2
import generated.catalogo_pb2_grpc as catalogo_pb2_grpc
import generated.pricing_pb2 as pricing_pb2
import generated.pricing_pb2_grpc as pricing_pb2_grpc

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stub_a = catalogo_pb2_grpc.CatalogoServiceStub(grpc.insecure_channel("localhost:50051"))
stub_b = pricing_pb2_grpc.OrcamentoServiceStub(grpc.insecure_channel("localhost:50052"))

@app.post("/get-pecas")
def get_pecas(body: dict):
    carro = catalogo_pb2.Carro()
    json_format.ParseDict(body, carro)
    resp = stub_a.GetPecas(carro)
    return json_format.MessageToDict(resp)


@app.post("/calcular")
def calcular(body: dict):
   req = pricing_pb2.OrcamentoRequest()
   json_format.ParseDict(body, req)
   resp = stub_b.Calcular(req)
   return json_format.MessageToDict(resp)


# @app.post("/pagar")
# def pagar(body: dict):
#  req = pricing_pb2.OrcamentoRequest()
 #  json_format.ParseDict(body, req)
  # resp = stub_b.Calcular(req)
   # return json_format.MessageToDict(resp)
