const express = require("express");
const roteador = express();
const {
  produtosDisponiveis,
  produtosNoCarrinho,
  inserirProdutosCarrinho,
  limparCarrinho,
  editarCarrinho,
  excluirProduto,
  finalizarCompra,
} = require("./controladores/controladoresDeRotas");

roteador.get("/produtos", produtosDisponiveis);
roteador.get("/carrinho", produtosNoCarrinho);
roteador.post("/carrinho/produtos", inserirProdutosCarrinho);
roteador.patch("/carrinho/produtos/:idProduto", editarCarrinho);
roteador.delete("/carrinho/produtos/:idProduto", excluirProduto);
roteador.delete("/carrinho", limparCarrinho);
roteador.post("/finalizar-compra", finalizarCompra);

module.exports = roteador;
