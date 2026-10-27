// Versões: a do projeto (a mesma do release no GitHub) e a de cada painel, pelo nome da pasta dele.
// Para lançar uma versão nova, mude os números aqui: a etiqueta no canto de cada janela vem deste arquivo.
const VERSOES = {
  projeto: '1.4',
  'Painel Corsa GLS Millenium Super com conta giros': '1.2',
  'Painel Astra 2011 Branco': '1.2',
  'Painel CG 125 2000': '1.2',
  'Painel Kadett GLS 98': '1.3',
  'Painel Vectra B CD Challenge': '1.4',
  'Painel Vectra Elite': '1.4',
  'Painel Corsa GT Spec': '1.4',
};

// etiqueta no canto de cima da janela: na página de um painel, a versão dele; no seletor, a do projeto
addEventListener('DOMContentLoaded', () => {
  const pasta = decodeURIComponent(location.pathname.split('/').slice(-2, -1)[0] || '');
  document.body.insertAdjacentHTML('beforeend',
    `<div id="versao" style="position:fixed;top:6px;right:10px;z-index:3;font:12px system-ui,sans-serif;color:#8b949e;pointer-events:none">v${VERSOES[pasta] || VERSOES.projeto}</div>`);
});
