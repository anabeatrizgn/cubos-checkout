const filtrarProduto = async (produtos, categoriaDoProduto) => {
  if (produtos.length > 0) {
    produtos = produtos.filter(
      (produto) => produto.categoria.toLowerCase() === categoriaDoProduto
    );
  }
  return produtos;
};

const filtrarPrecoMin = async (array, valorMin) => {
  const produtosMaisBaratos = array.filter(
    (produto) => produto.preco >= valorMin
  );
  return produtosMaisBaratos;
};

const filtrarPrecoMax = async (array, valorMax) => {
  const produtosMaisCaros = await array.filter(
    (produto) => produto.preco <= valorMax
  );

  return produtosMaisCaros;
};

const validarUsuario = async (dadosDoComprador) => {
  if (
    !dadosDoComprador.type ||
    !dadosDoComprador.country ||
    !dadosDoComprador.name ||
    !dadosDoComprador.documents[0].type ||
    !dadosDoComprador.documents[0].number
  ) {
    return "Campo obrigatório";
  }
  if (
    typeof dadosDoComprador.type !== "string" ||
    typeof dadosDoComprador.country !== "string" ||
    typeof dadosDoComprador.name !== "string" ||
    typeof dadosDoComprador.documents[0].type !== "string" ||
    typeof dadosDoComprador.documents[0].number !== "string"
  ) {
    return "Verifique se os campos estão entre aspas";
  }

  if (
    dadosDoComprador.documents[0].number.includes(".") ||
    dadosDoComprador.documents[0].number.includes("-")
  ) {
    return "Documento deve apenas conter números";
  }

  if (dadosDoComprador.documents[0].type === "cpf") {
    if (dadosDoComprador.documents[0].number.length < 11)
      return "CPF deve conter 11 números";
  }

  if (dadosDoComprador.country.length !== 2) {
    return "País deve ser preenchido com dois dígitos";
  }

  if (dadosDoComprador.type !== "individual") {
    return "Este e-commerce só atende pessoas físicas";
  }

  if (dadosDoComprador.name.trim().split(" ").length < 1) {
    return "Insira nome e sobrenome";
  }
};

module.exports = {
  filtrarProduto,
  filtrarPrecoMin,
  filtrarPrecoMax,
  validarUsuario,
};
