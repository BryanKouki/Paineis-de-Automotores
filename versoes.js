// Versões: a do projeto (a mesma do release no GitHub) e a de cada painel, pelo nome da pasta dele.
// Para lançar uma versão nova, mude os números aqui: a etiqueta no canto de cada janela vem deste arquivo.
const VERSOES = {
  projeto: '1.1',
  'Painel Corsa Azul Conta Giros': '1.1',
  'Painel Astra 2011 Branco': '1.1',
  'Painel CG 125 2000': '1.1',
};

// etiqueta no canto de cima da janela: na página de um painel, a versão dele; no seletor, a do projeto
addEventListener('DOMContentLoaded', () => {
  const pasta = decodeURIComponent(location.pathname.split('/').slice(-2, -1)[0] || '');
  document.body.insertAdjacentHTML('beforeend',
    `<div id="versao" style="position:fixed;top:6px;right:10px;z-index:3;font:12px system-ui,sans-serif;color:#8b949e;pointer-events:none">v${VERSOES[pasta] || VERSOES.projeto}</div>`);
});
