const axios = require("axios");
let addBusinessDays = require("date-fns/addBusinessDays");

const {
  lerCarrinho,
  atualizarCarrinho,
  zerarCarrinho,
  adicionarAoCarrinho,
  excluirDoCarrinho,
} = require("./utilitários/carrinho");
const {
  conferirEstoque,
  atualizarEstoque,
  abaterEstoque,
} = require("./utilitários/estoque");
const {
  filtrarProduto,
  filtrarPrecoMin,
  filtrarPrecoMax,
  validarUsuario,
} = require("./utilitários/filtros");

const produtosDisponiveis = async (req, res) => {
  let produtos = await conferirEstoque();

  if (req.query.categoria) {
    produtos = await filtrarProduto(produtos, req.query.categoria);
  }

  if (req.query.precoInicial) {
    produtos = await filtrarPrecoMin(produtos, Number(req.query.precoInicial));
  }

  if (req.query.precoFinal) {
    produtos = await filtrarPrecoMax(produtos, Number(req.query.precoFinal));
  }

  if (produtos.length > 0) {
    res.status(200).json(produtos);
    return;
  } else {
    res.status(404).json({
      mensagem: "Produto não encontrado",
    });
  }
};

const produtosNoCarrinho = async (req, res) => {
  const carrinho = await lerCarrinho();
  return res.status(200).json(carrinho);
};

const inserirProdutosCarrinho = async (req, res) => {
  const produtos = await conferirEstoque();
  const item = produtos.find((produto) => produto.id === req.body.id);
  if (item) {
    if (item.estoque >= Number(req.body.quantidade)) {
      const itemNoCarrinho = {
        id: item.id,
        quantidade: req.body.quantidade,
        nome: item.nome,
        preco: item.preco,
        categoria: item.categoria,
      };
      let carrinho = await lerCarrinho();
      carrinho = await adicionarAoCarrinho(carrinho, itemNoCarrinho);
      await atualizarCarrinho(carrinho);
      res.status(201).json(carrinho);
    } else {
      res.status(400).json({
        mensagem: `${item.estoque} é a quantidade do produto ${item.nome} disponível em estoque`,
      });
    }
  } else {
    res.status(401).json({
      mensagem: "Id incorreto ou não existe",
    });
  }
};

const editarCarrinho = async (req, res) => {
  const carrinho = await lerCarrinho();
  const itemParaEditar = {
    id: Number(req.params.idProduto),
    quantidade: req.body.quantidade,
  };
  const index = carrinho.produtos.findIndex(
    (produto) => itemParaEditar.id === produto.id
  );
  if (index === -1) {
    res.status(404).json({
      mensagem: "O id informado não corresponde a nenhum produto do carrinho",
    });
  } else {
    const produtos = await conferirEstoque();
    const item = produtos.find((produto) => produto.id === itemParaEditar.id);
    if (item) {
      const quantidadeTotal = (carrinho.produtos[index].quantidade +=
        itemParaEditar.quantidade);
      if (item.estoque >= quantidadeTotal || quantidadeTotal >= 0) {
        carrinho.produtos[index].quantidade = quantidadeTotal;
        await atualizarCarrinho(carrinho);
        res.json(carrinho);
      } else {
        res.status(400).json({
          mensagem: `${item.estoque} é a quantidade do produto ${item.nome} disponível em estoque`,
        });
      }
    } else {
      res.status(401).json({
        mensagem: "Id incorreto",
      });
    }
  }
};

const excluirProduto = async (req, res) => {
  let carrinho = await lerCarrinho();
  carrinho = await excluirDoCarrinho(carrinho, Number(req.params.idProduto));
  await atualizarCarrinho(carrinho);
  res.status(201).json(carrinho);
};

const limparCarrinho = async (req, res) => {
  const carrinho = await zerarCarrinho();
  await atualizarCarrinho(carrinho);
  res.status(200).json({
    mensagem: "Operação concluída com sucesso",
  });
};

const finalizarCompra = async (req, res) => {
  let carrinho = await lerCarrinho();

  if (carrinho.produtos.length === 0) {
    res.status(400).json({
      mensagem: "Carrinho vazio",
    });
    return;
  }

  const produtos = await conferirEstoque();

  for (let unid of carrinho.produtos) {
    let qtdMenorQueEstoque = produtos.find(
      (produto) => produto.id === unid.id && produto.estoque < unid.estoque
    );
    if (qtdMenorQueEstoque) {
      return res.json({
        mensagem: `${qtdMenorQueEstoque.nome} tem ${qtdMenorQueEstoque.estoque} de produto(s) em estoque`,
      });
    }
  }

  for (let unid of carrinho.produtos) {
    produtos.forEach(
      (produto) => produto.id === unid.id,
      (estoque = await abaterEstoque(unid)),
      await atualizarEstoque(estoque)
    );
  }

  const erro = await validarUsuario(req.body);

  if (erro) {
    res.status(401).json({
      mensagem: `${erro}`,
    });
    return;
  }

  if (req.query.cupom) {
    carrinho.totalAPagar =
      carrinho.totalAPagar -
      (carrinho.totalAPagar * Number(req.query.cupom)) / 100;
  }

  // const pedido = await axios.post(
  //   "https://api.pagar.me/1/transactions?api_key=ak_test_rFF3WFkcS9DRdBK7Ocw6QOzOOQEScS",
  //   JSON.stringify({
  //     amount: carrinho.totalAPagar,
  //     payment_method: "boleto",
  //     boleto_expiration_date: addBusinessDays(new Date(), 3),
  //     customer: req.body,
  //   })
  // );

  // const vendas = await lerRelDeVendas();
  // vendas.push(pedido.data.acquirer_id);
  // await atualizarRelDeVendas(vendas);

  const carrinhoFechado = carrinho;

  carrinho = await zerarCarrinho();
  await atualizarCarrinho(carrinho);

  res.status(201).json({
    mensagem: "Pedido entregue com sucesso",
    dadosDoPedido: carrinhoFechado,
    //linkBoleto: pedido.data.boleto_url,
  });
};

module.exports = {
  produtosDisponiveis,
  produtosNoCarrinho,
  inserirProdutosCarrinho,
  limparCarrinho,
  editarCarrinho,
  excluirProduto,
  finalizarCompra,
};
