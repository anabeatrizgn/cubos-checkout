const fs = require("fs/promises");

const lerEstoqueTodo = async () => {
  let estoque = JSON.parse(await fs.readFile("data.json"));
  estoque = estoque.produtos;
  return estoque;
};

const conferirEstoque = async () => {
  try {
    const estoque = await lerEstoqueTodo();
    const produtos = estoque.filter((produto) => produto.estoque > 0);
    if (produtos.length > 0) {
      return produtos;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
    return { mensagem: "Erro interno. Aguarde alguns instantes" };
  }
};

const abaterEstoque = async (item) => {
  const estoque = await lerEstoqueTodo();
  const index = estoque.findIndex((produto) => item.id === produto.id);
  estoque[index].estoque -= item.quantidade;
  return estoque;
};

const atualizarEstoque = async (estoque) => {
  const json = JSON.stringify({produtos: estoque}, null, 2);
  await fs.writeFile("data.json", json);
};

module.exports = {
  conferirEstoque,
  atualizarEstoque,
  abaterEstoque,
};
