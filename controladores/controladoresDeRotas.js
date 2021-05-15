const axios = require("axios");
let addBusinessDays = require("date-fns/addBusinessDays");

const {
  lerCarrinho,
  atualizarCarrinho,
  zerarCarrinho,
  adicionarAoCarrinho,
  excluirDoCarrinho,
} = require("./carrinho");
const {
  conferirEstoque,
  atualizarEstoque,
  abaterEstoque,
} = require("./estoque");
const {
  filtrarProduto,
  filtrarPrecoMin,
  filtrarPrecoMax,
  validarUsuario,
} = require("./filtros");

const {
  lerRelDeVendas,
  atualizarRelDeVendas
} = require("./controleVendas");

const produtosDisponiveis = async (req, res) => {
  let produtos = await conferirEstoque();

  if (req.query.categoria) {
    produtos = await filtrarProduto(produtos, req.query.categoria);
  }

  if (req.query.precoInicial) {
    produtos = await filtrarPrecoMin(produtos, req.query.precoInicial);
  }

  if (req.query.precoFinal) {
    produtos = await filtrarPrecoMax(produtos, req.query.precoFinal);
  }

  if (produtos.length > 0) {
    res.json(produtos);
    return;
  } else {
    res.json({
      mensagem: "Produto não encontrado",
    });
  }
};

const produtosNoCarrinho = async (req, res) => {
  const carrinho = await lerCarrinho();
  return res.json(carrinho);
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
      res.json(carrinho);
    } else {
      res.json({
        mensagem: `${item.estoque} é a quantidade do produto ${item.nome} disponível em estoque`,
      });
    }
  } else {
    res.json({
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
    res.json({
      mensagem: "O id informado não corresponde a nenhum produto do carrinho",
    });
  } else {
    const produtos = await conferirEstoque();
    const item = produtos.find((produto) => produto.id === itemParaEditar.id);
    if (item) {
      const quantidadeTotal = (carrinho.produtos[index].quantidade +=
        itemParaEditar.quantidade);
      if (item.estoque >= quantidadeTotal) {
        carrinho.produtos[index].quantidade = quantidadeTotal;
        await atualizarCarrinho(carrinho);
        res.json(carrinho);
      } else {
        res.json({
          mensagem: `${item.estoque} é a quantidade do produto ${item.nome} disponível em estoque`,
        });
      }
    } else {
      res.json({
        mensagem: "Id incorreto",
      });
    }
  }
};

const excluirProduto = async (req, res) => {
  let carrinho = await lerCarrinho();
  carrinho = await excluirDoCarrinho(carrinho, Number(req.params.idProduto));
  await atualizarCarrinho(carrinho);
  res.json(carrinho);
};

const limparCarrinho = async (req, res) => {
  const carrinho = await zerarCarrinho();
  await atualizarCarrinho(carrinho);
  res.json({
    mensagem: "Operação concluída com sucesso",
  });
};

const finalizarCompra = async (req, res) => {
  let carrinho = await lerCarrinho();

  if (carrinho.produtos.length === 0) {
    res.json({
      mensagem: "Carrinho vazio",
    });
    return;
  }

  const produtos = await conferirEstoque();

  for (let unid of carrinho.produtos) {
    produtos.forEach(
      (produto) => produto.id === unid.id,
      (estoque = await abaterEstoque(unid)),
      await atualizarEstoque(estoque)
    );
  }

  const erro = await validarUsuario(req.body);

  if (erro) {
    res.json({
      mensagem: `${erro}`,
    });
    return;
  }

  if (req.query.cupom) {
    carrinho.totalAPagar = carrinho.totalAPagar - carrinho.totalAPagar*Number(req.query.cupom)
  }

  const dadosDaCompra = {
    amount: carrinho.totalAPagar,
    payment_methot: 'boleto',
    boleto_expiration_date: addBusinessDays(new Date(), 3),
    costumer: req.body
  };

try{
  const pedido = await axios.post(`https://api.pagar.me/1/transactions?api_key=ak_test_rFF3WFkcS9DRdBK7Ocw6QOzOOQEScS`, dadosDaCompra);
 console.log(pedido);
  res.json({
    mensagem: "Pedido entregue com sucesso",
    dadosDoPedido: carrinho,
    linkBoleto: pedido.data.boleto_url
  });
} catch(error) {
  console.log(error);
}
  

 

  const vendas = await lerRelDeVendas();
  vendas.push(pedido.data.acquirer_id);
  await atualizarRelDeVendas(vendas);

  carrinho = await zerarCarrinho();
  await atualizarCarrinho(carrinho);
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
