const fs = require("fs/promises");
let addBusinessDays = require("date-fns/addBusinessDays");

const zerarCarrinho = async () => {
  const carrinho = {
    subtotal: 0,
    dataDeEntrega: null,
    valorDoFrete: 0,
    totalAPagar: 0,
    produtos: [],
  };
  return carrinho;
};

const atualizarCarrinho = async (carrinho) => {
  const json = JSON.stringify(carrinho, null, 2);
  await fs.writeFile("MeuCarrinho.json", json);
};

const lerCarrinho = async () => {
  let carrinho;
  try {
    carrinho = JSON.parse(await fs.readFile("MeuCarrinho.json"));
    return carrinho;
  } catch {
    carrinho = await zerarCarrinho();
    await atualizarCarrinho(carrinho);
    return carrinho;
  }
};

const adicionarAoCarrinho = async (carrinho, item) => {
  const index = carrinho.produtos.findIndex(
    (produto) => item.id === produto.id
  );
  if (index === -1) {
    carrinho.subtotal += item.preco;
    carrinho.dataDeEntrega = addBusinessDays(new Date(), 15);
    carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
    carrinho.produtos.push(item);
  } else {
    carrinho.produtos[index].quantidade += item.quantidade;
  }
  return carrinho;
};

const excluirDoCarrinho = async (carrinho, id) => {
  const index = carrinho.produtos.findIndex((produto) => id === produto.id);
  if (index === -1) {
    return {
      mensagem: "O id informado não corresponde a nenhum produto do carrinho",
    };
  } else {
    carrinho.subtotal -= carrinho.produtos[index].preco;
    carrinho.dataDeEntrega =
      carrinho.subtotal === 0 ? null : addBusinessDays(new Date(), 15);
    carrinho.valorDoFrete =
      carrinho.subtotal === 0 ? 0 : carrinho.subtotal >= 20000 ? 0 : 5000;
    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
    carrinho.produtos.splice(index, 1);

    return carrinho;
  }
};

module.exports = {
  lerCarrinho,
  atualizarCarrinho,
  zerarCarrinho,
  adicionarAoCarrinho,
  excluirDoCarrinho,
};
