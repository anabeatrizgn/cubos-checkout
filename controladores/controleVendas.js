const fs = require("fs/promises");

const lerRelDeVendas = async () => {
    const vendas = JSON.parse(await fs.readFile("ControleVendas.json"));
    return vendas;
};

const atualizarRelDeVendas = async (vendas) => {
  const json = JSON.stringify(vendas, null, 2);
  await fs.writeFile("ControleVendas.json", json);
};

module.exports = {
  lerRelDeVendas,
  atualizarRelDeVendas
};