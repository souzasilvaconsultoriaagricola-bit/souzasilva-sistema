import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './supabase';
import Producao from './Producao';
import ImportadorDocumentos from './ImportadorDocumentos';
import ImportadorBonsucro from './ImportadorBonsucro';
type Registro = Record<string, any>;

type Tela =
  | 'Painel'
  | 'Clientes'
  | 'Cliente'
  | 'Propriedade'
  | 'Agricultura'
  | 'Talhão'
  | 'Planejamento'
  | 'Fazendas'
  | 'Glebas'
  | 'Talhões'
  | 'Áreas'
  | 'Safras'
  | 'Plantio'
  | 'Produção'
  | 'Manejo'
  | 'Pragas'
  | 'Pecuária'
  | 'Rebanhos'
  | 'Animais'
  | 'Pastagens'
  | 'Sanidade'
  | 'Leite'
  | 'Florestas'
  | 'Talhões Florestais'
  | 'Inventário Florestal'
  | 'Manejo Florestal'
  | 'Produção Florestal'
  | 'Irrigação'
  | 'Frota'
  | 'Armazéns'
  | 'Insumos'
  | 'Estoque'
  | 'Aviação Agrícola e Drones'
  | 'Auditorias'
  | 'Certificações'
  | 'Documentos'
  | 'RH / Segurança'
  | 'Indicadores'
  | 'Configurações';

type ResumoGeral = {
  clientes: number;
  fazendas: number;
  glebas: number;
  talhoes: number;
};

type ResumoFazenda = {
  glebas: number;
  talhoes: number;
  areas: number;
  manejos: number;
  pragas: number;
  irrigacao: number;
  operacoesAereas: number;
};

type DadosTalhao = {
  planejamentos: Registro[];
  plantios: Registro[];
  producoes: Registro[];
  manejos: Registro[];
  pragas: Registro[];
  areas: Registro[];
};

type FormPlanejamento = {
  safra: string;
  cultura: string;
  cultivar: string;
  area_planejada_ha: string;
  data_plantio_prevista: string;
  data_colheita_prevista: string;
  sistema_plantio: string;
  populacao_planejada: string;
  unidade_populacao: string;
  espacamento_m: string;
  quantidade_semente: string;
  unidade_semente: string;
  finalidade: string;
  observacoes: string;
};

const formVazio: FormPlanejamento = {
  safra: '',
  cultura: '',
  cultivar: '',
  area_planejada_ha: '',
  data_plantio_prevista: '',
  data_colheita_prevista: '',
  sistema_plantio: '',
  populacao_planejada: '',
  unidade_populacao: 'plantas/ha',
  espacamento_m: '',
  quantidade_semente: '',
  unidade_semente: 'kg',
  finalidade: '',
  observacoes: '',
};

const menu: {
  tela: Tela;
  nome: string;
  icone: string;
  grupo?: string;
}[] = [
  { tela: 'Painel', nome: 'Painel', icone: '▦', grupo: 'VISÃO GERAL' },

  { tela: 'Clientes', nome: 'Clientes', icone: '♙', grupo: 'CADASTROS' },
  { tela: 'Fazendas', nome: 'Fazendas', icone: '⌂' },
  { tela: 'Glebas', nome: 'Glebas', icone: '◇' },
  { tela: 'Talhões', nome: 'Talhões', icone: '▤' },
  { tela: 'Áreas', nome: 'Áreas', icone: '⌖' },

  {
    tela: 'Agricultura',
    nome: 'Visão Agrícola',
    icone: '♧',
    grupo: 'AGRICULTURA',
  },
  { tela: 'Safras', nome: 'Safras / Planejamento', icone: '◫' },
  { tela: 'Plantio', nome: 'Plantio', icone: '⌁' },
  { tela: 'Produção', nome: 'Produção', icone: '↗' },
  { tela: 'Manejo', nome: 'Manejo', icone: '◎' },
  { tela: 'Pragas', nome: 'Monitoramento de Pragas', icone: '✣' },

  {
    tela: 'Pecuária',
    nome: 'Visão da Pecuária',
    icone: '◉',
    grupo: 'PECUÁRIA',
  },
  { tela: 'Rebanhos', nome: 'Lotes / Rebanhos', icone: '◌' },
  { tela: 'Animais', nome: 'Animais', icone: '♙' },
  { tela: 'Pastagens', nome: 'Pastagens / Piquetes', icone: '⌗' },
  { tela: 'Sanidade', nome: 'Manejo Sanitário', icone: '✚' },
  { tela: 'Leite', nome: 'Produção de Leite', icone: '◍' },

  {
    tela: 'Florestas',
    nome: 'Visão Florestal',
    icone: '♠',
    grupo: 'FLORESTAS',
  },
  { tela: 'Talhões Florestais', nome: 'Talhões Florestais', icone: '♜' },
  { tela: 'Inventário Florestal', nome: 'Inventário Florestal', icone: '▥' },
  { tela: 'Manejo Florestal', nome: 'Manejo Florestal', icone: '♣' },
  { tela: 'Produção Florestal', nome: 'Produção / Colheita', icone: '▣' },

  { tela: 'Irrigação', nome: 'Irrigação', icone: '◉', grupo: 'OPERAÇÃO' },
  { tela: 'Frota', nome: 'Frota', icone: '◆' },
  { tela: 'Armazéns', nome: 'Armazéns', icone: '▥' },
  { tela: 'Insumos', nome: 'Insumos', icone: '▧' },
  { tela: 'Estoque', nome: 'Estoque', icone: '▤' },
  {
    tela: 'Aviação Agrícola e Drones',
    nome: 'Aviação Agrícola e Drones',
    icone: '✈',
  },

  { tela: 'Auditorias', nome: 'Auditorias', icone: '✓', grupo: 'GESTÃO' },
  { tela: 'Certificações', nome: 'Certificações', icone: '★' },
  { tela: 'Documentos', nome: 'Documentos', icone: '▱' },
  { tela: 'RH / Segurança', nome: 'RH / Segurança', icone: '♟' },
  { tela: 'Indicadores', nome: 'Indicadores', icone: '↗' },
  { tela: 'Configurações', nome: 'Configurações', icone: '⚙' },
];

function App() {
  const [sessao, setSessao] = useState<any>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (ativo) {
        setSessao(data.session ?? null);
        setCarregandoSessao(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, novaSessao) => {
        if (ativo) {
          setSessao(novaSessao);
          setCarregandoSessao(false);
        }
      }
    );
    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function entrarNoSistema(event: React.FormEvent) {
    event.preventDefault();
    setEntrando(true);
    setErroLogin('');
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLogin.trim(),
      password: senhaLogin,
    });
    if (error) {
      setErroLogin(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha inválidos.'
          : error.message
      );
      setEntrando(false);
      return;
    }
    setSenhaLogin('');
    setEntrando(false);
  }

  async function sairDoSistema() {
    await supabase.auth.signOut();
  }

  const [tela, setTela] = useState<Tela>('Painel');

  const [clientes, setClientes] = useState<Registro[]>([]);
  const [fazendas, setFazendas] = useState<Registro[]>([]);
  const [fazendasCliente, setFazendasCliente] = useState<Registro[]>([]);

  const [clienteSelecionado, setClienteSelecionado] = useState<Registro | null>(
    null
  );

  const [fazendaSelecionada, setFazendaSelecionada] = useState<Registro | null>(
    null
  );

  const [talhaoSelecionado, setTalhaoSelecionado] = useState<Registro | null>(
    null
  );

  const [talhoesAgricultura, setTalhoesAgricultura] = useState<Registro[]>([]);

  const [planejamentos, setPlanejamentos] = useState<Registro[]>([]);

  const [plantios, setPlantios] = useState<Registro[]>([]);

  const [producoes, setProducoes] = useState<Registro[]>([]);

  const [dadosTalhao, setDadosTalhao] = useState<DadosTalhao>({
    planejamentos: [],
    plantios: [],
    producoes: [],
    manejos: [],
    pragas: [],
    areas: [],
  });

  const [formPlanejamento, setFormPlanejamento] =
    useState<FormPlanejamento>(formVazio);

  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const [resumo, setResumo] = useState<ResumoGeral>({
    clientes: 0,
    fazendas: 0,
    glebas: 0,
    talhoes: 0,
  });

  const [resumoFazenda, setResumoFazenda] = useState<ResumoFazenda>({
    glebas: 0,
    talhoes: 0,
    areas: 0,
    manejos: 0,
    pragas: 0,
    irrigacao: 0,
    operacoesAereas: 0,
  });

  async function contarTabela(tabela: string) {
    const { count, error } = await supabase
      .from(tabela)
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count ?? 0;
  }

  async function contarFazenda(tabela: string, fazendaId: string) {
    const { count, error } = await supabase
      .from(tabela)
      .select('*', { count: 'exact', head: true })
      .eq('fazenda_id', fazendaId);

    if (error) return 0;
    return count ?? 0;
  }

  async function carregarResumo() {
    const [clientes, fazendas, glebasDiretas, glebasVinculadas, talhoes] =
      await Promise.all([
        contarTabela('clientes'),
        contarTabela('fazendas'),
        contarTabela('glebas'),
        contarTabela('fazendas_glebas'),
        contarTabela('talhoes'),
      ]);

    setResumo({
      clientes,
      fazendas,
      glebas: glebasDiretas || glebasVinculadas,
      talhoes,
    });
  }

  async function carregarFazendas() {
    const { data } = await supabase.from('fazendas').select('*').order('nome');

    setFazendas(data ?? []);
  }

  async function carregarClientes() {
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');

    if (error) {
      setErro(error.message);
    } else {
      setClientes(data ?? []);
    }

    setCarregando(false);
  }

  async function abrirCliente(cliente: Registro) {
    setClienteSelecionado(cliente);
    setFazendaSelecionada(null);
    setTalhaoSelecionado(null);
    setTela('Cliente');
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase
      .from('fazendas')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('nome');

    if (error) {
      setErro(error.message);
      setFazendasCliente([]);
    } else {
      setFazendasCliente(data ?? []);
    }

    setCarregando(false);
  }

  async function carregarResumoFazenda(fazenda: Registro) {
    const [
      glebas,
      talhoes,
      areas,
      manejos,
      pragas,
      irrigacao,
      operacoesAereas,
    ] = await Promise.all([
      contarFazenda('glebas', fazenda.id),
      contarFazenda('talhoes', fazenda.id),
      contarFazenda('areas_geograficas', fazenda.id),
      contarFazenda('manejo_aplicacoes', fazenda.id),
      contarFazenda('monitoramento_pragas', fazenda.id),
      contarFazenda('irrigacao', fazenda.id),
      contarFazenda('operacoes_aereas', fazenda.id),
    ]);

    setResumoFazenda({
      glebas,
      talhoes,
      areas,
      manejos,
      pragas,
      irrigacao,
      operacoesAereas,
    });
  }

  async function abrirPropriedade(fazenda: Registro) {
    setFazendaSelecionada(fazenda);
    setTalhaoSelecionado(null);
    setTela('Propriedade');
    setCarregando(true);

    await carregarResumoFazenda(fazenda);

    setCarregando(false);
  }

  async function abrirAgricultura() {
    if (!fazendaSelecionada) {
      setTela('Agricultura');
      return;
    }

    setTela('Agricultura');
    setCarregando(true);
    setErro('');

    const { data: talhoes, error } = await supabase
      .from('talhoes')
      .select('*')
      .eq('fazenda_id', fazendaSelecionada.id)
      .order('nome');

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    const lista = talhoes ?? [];
    setTalhoesAgricultura(lista);

    const ids = lista.map((t) => t.id);

    if (!ids.length) {
      setPlanejamentos([]);
      setPlantios([]);
      setProducoes([]);
      setCarregando(false);
      return;
    }

    const [plan, plant, prod] = await Promise.all([
      supabase.from('planejamento_safra').select('*').in('talhao_id', ids),

      // Plantios possuem fazenda_id. Consultar diretamente pela fazenda
      // evita URLs enormes quando a propriedade tem muitos talhões (ex.: 011).
      supabase
        .from('plantios')
        .select('*')
        .eq('fazenda_id', fazendaSelecionada.id),

      supabase.from('producao').select('*').in('talhao_id', ids),
    ]);

    setPlanejamentos(plan.data ?? []);
    setPlantios(plant.data ?? []);
    setProducoes(prod.data ?? []);

    setCarregando(false);
  }

  async function consultaSegura(tabela: string, talhaoId: string) {
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .eq('talhao_id', talhaoId);

    if (error) {
      console.warn(`Consulta ${tabela}:`, error.message);
      return [];
    }

    return data ?? [];
  }

  async function carregarDadosTalhao(talhao: Registro) {
    const [planejamento, plantio, producao, manejo, pragas, areas] =
      await Promise.all([
        consultaSegura('planejamento_safra', talhao.id),
        consultaSegura('plantios', talhao.id),
        consultaSegura('producao', talhao.id),
        consultaSegura('manejo_aplicacoes', talhao.id),
        consultaSegura('monitoramento_pragas', talhao.id),
        consultaSegura('areas_geograficas', talhao.id),
      ]);

    const novosDados = {
      planejamentos: planejamento,
      plantios: plantio,
      producoes: producao,
      manejos: manejo,
      pragas,
      areas,
    };

    setDadosTalhao(novosDados);

    return novosDados;
  }

  async function abrirTalhao(talhao: Registro) {
    setTalhaoSelecionado(talhao);
    setTela('Talhão');
    setCarregando(true);
    setErro('');

    await carregarDadosTalhao(talhao);

    setCarregando(false);
  }

  function abrirNovoPlanejamento() {
    if (!talhaoSelecionado) return;

    const planejamentoExistente = dadosTalhao.planejamentos[0];

    if (planejamentoExistente) {
      setFormPlanejamento({
        safra: planejamentoExistente.safra || '',
        cultura: planejamentoExistente.cultura || '',
        cultivar: planejamentoExistente.cultivar || '',
        area_planejada_ha:
          planejamentoExistente.area_planejada_ha != null
            ? String(planejamentoExistente.area_planejada_ha)
            : '',
        data_plantio_prevista:
          planejamentoExistente.data_plantio_prevista || '',
        data_colheita_prevista:
          planejamentoExistente.data_colheita_prevista || '',
        sistema_plantio: planejamentoExistente.sistema_plantio || '',
        populacao_planejada:
          planejamentoExistente.populacao_planejada != null
            ? String(planejamentoExistente.populacao_planejada)
            : '',
        unidade_populacao:
          planejamentoExistente.unidade_populacao || 'plantas/ha',
        espacamento_m:
          planejamentoExistente.espacamento_m != null
            ? String(planejamentoExistente.espacamento_m)
            : '',
        quantidade_semente:
          planejamentoExistente.quantidade_semente != null
            ? String(planejamentoExistente.quantidade_semente)
            : '',
        unidade_semente: planejamentoExistente.unidade_semente || 'kg',
        finalidade: planejamentoExistente.finalidade || '',
        observacoes: planejamentoExistente.observacoes || '',
      });
    } else {
      setFormPlanejamento({
        ...formVazio,
        cultura: talhaoSelecionado.cultura || '',
        cultivar:
          talhaoSelecionado.variedade || talhaoSelecionado.cultivar || '',
        safra: talhaoSelecionado.safra || '',
        area_planejada_ha:
          talhaoSelecionado.area_ha != null
            ? String(talhaoSelecionado.area_ha)
            : '',
      });
    }

    setMensagemSucesso('');
    setErro('');
    setTela('Planejamento');
  }

  function numeroOuNull(valor: string) {
    if (!valor.trim()) return null;

    const numero = Number(valor.replace(',', '.'));

    return Number.isFinite(numero) ? numero : null;
  }

  async function salvarPlanejamento(event: React.FormEvent) {
    event.preventDefault();

    if (!talhaoSelecionado || !fazendaSelecionada) {
      return;
    }

    if (!formPlanejamento.cultura.trim()) {
      setErro('Informe a cultura planejada.');
      return;
    }

    setSalvando(true);
    setErro('');
    setMensagemSucesso('');

    const registro = {
      cliente_id: clienteSelecionado?.id || null,

      fazenda_id: fazendaSelecionada.id,

      gleba_id: talhaoSelecionado.gleba_id || null,

      talhao_id: talhaoSelecionado.id,

      safra: formPlanejamento.safra.trim() || null,

      cultura: formPlanejamento.cultura.trim(),

      cultivar: formPlanejamento.cultivar.trim() || null,

      situacao: 'planejado',

      data_plantio_prevista: formPlanejamento.data_plantio_prevista || null,

      // IMPORTANTE:
      // planejamento não é plantio.
      data_plantio_realizada: null,

      data_colheita_prevista: formPlanejamento.data_colheita_prevista || null,

      sistema_plantio: formPlanejamento.sistema_plantio.trim() || null,

      populacao_planejada: numeroOuNull(formPlanejamento.populacao_planejada),

      unidade_populacao: formPlanejamento.unidade_populacao.trim() || null,

      area_planejada_ha: numeroOuNull(formPlanejamento.area_planejada_ha),

      espacamento_m: numeroOuNull(formPlanejamento.espacamento_m),

      quantidade_semente: numeroOuNull(formPlanejamento.quantidade_semente),

      unidade_semente: formPlanejamento.unidade_semente.trim() || null,

      finalidade: formPlanejamento.finalidade.trim() || null,

      observacoes: formPlanejamento.observacoes.trim() || null,

      atualizado_em: new Date().toISOString(),
    };

    const existente = dadosTalhao.planejamentos[0];

    let resposta;

    if (existente?.id) {
      resposta = await supabase
        .from('planejamento_safra')
        .update(registro)
        .eq('id', existente.id)
        .select();
    } else {
      resposta = await supabase
        .from('planejamento_safra')
        .insert(registro)
        .select();
    }

    if (resposta.error) {
      setErro(resposta.error.message);
      setSalvando(false);
      return;
    }

    await carregarDadosTalhao(talhaoSelecionado);

    await abrirAgricultura();

    // Mantém o talhão selecionado e volta para
    // sua ficha após atualizar os contadores.
    await carregarDadosTalhao(talhaoSelecionado);

    setTela('Talhão');
    setMensagemSucesso('Planejamento salvo com sucesso.');
    setSalvando(false);
  }

  useEffect(() => {
    carregarResumo();
    carregarFazendas();
  }, []);

  useEffect(() => {
    if (tela === 'Clientes') {
      carregarClientes();
      carregarFazendas();
    }
  }, [tela]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return clientes;

    return clientes.filter((c) =>
      Object.values(c).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(termo)
      )
    );
  }, [clientes, busca]);

  function navegar(novaTela: Tela) {
    if (novaTela === 'Agricultura' && fazendaSelecionada) {
      abrirAgricultura();
      return;
    }

    setTela(novaTela);
  }

  function tituloPagina() {
    if (tela === 'Cliente') return clienteSelecionado?.nome || 'Cliente';

    if (tela === 'Propriedade')
      return fazendaSelecionada?.nome || 'Propriedade';

    if (tela === 'Talhão') return talhaoSelecionado?.nome || 'Talhão';

    if (tela === 'Planejamento') return 'Planejamento Agrícola';

    return tela;
  }

  const tokenRelatorioPublico = (() => {
    const match = window.location.pathname.match(/\/([0-9a-f-]{36})\/?$/i);
    return window.location.pathname.startsWith('/relatorio/') ? (match?.[1] || '') : '';
  })();

  if (tokenRelatorioPublico) {
    return <RelatorioPublicoBroca token={tokenRelatorioPublico} />;
  }

  if (carregandoSessao) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#071b12',
          color: '#fff',
        }}
      >
        Carregando sistema...
      </div>
    );
  }

  if (!sessao) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'linear-gradient(135deg,#041b10,#0b3b22)',
        }}
      >
        <form
          onSubmit={entrarNoSistema}
          style={{
            width: '100%',
            maxWidth: 430,
            background: '#fff',
            borderRadius: 22,
            padding: 32,
            boxShadow: '0 24px 70px rgba(0,0,0,.32)',
            fontFamily: 'Arial,sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src="/Logo Souza Silva.jpeg"
              alt="Souza Silva"
              style={{ width: 190, maxWidth: '75%', marginBottom: 16 }}
            />
            <h1 style={{ margin: 0, color: '#123d28', fontSize: 27 }}>
              Gestão e Inteligência Agrícola
            </h1>
            <p style={{ color: '#66736c', margin: '8px 0 0' }}>
              Acesso ao sistema Souza Silva
            </p>
          </div>
          <label
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#234335',
              marginBottom: 7,
            }}
          >
            E-mail
          </label>
          <input
            type="email"
            value={emailLogin}
            onChange={(e) => setEmailLogin(e.target.value)}
            autoComplete="email"
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px 14px',
              border: '1px solid #cbd8d0',
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 15,
            }}
          />
          <label
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#234335',
              marginBottom: 7,
            }}
          >
            Senha
          </label>
          <input
            type="password"
            value={senhaLogin}
            onChange={(e) => setSenhaLogin(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px 14px',
              border: '1px solid #cbd8d0',
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 15,
            }}
          />
          {erroLogin && (
            <div
              style={{
                background: '#fff1f1',
                color: '#a51d1d',
                border: '1px solid #efcaca',
                borderRadius: 10,
                padding: 11,
                marginBottom: 14,
              }}
            >
              {erroLogin}
            </div>
          )}
          <button
            type="submit"
            disabled={entrando}
            style={{
              width: '100%',
              border: 0,
              borderRadius: 10,
              padding: '14px 16px',
              background: '#08783e',
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {entrando ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{css}</style>

      <aside className="sidebar">
        <div className="brand">
          <img
            src="/Logo Souza Silva.jpeg"
            alt="Souza Silva"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <nav>
          {menu.map((item, index) => {
            const anterior = menu[index - 1];

            const mostraGrupo = item.grupo && item.grupo !== anterior?.grupo;

            const ativo =
              tela === item.tela ||
              ((tela === 'Talhão' || tela === 'Planejamento') &&
                item.tela === 'Agricultura');

            return (
              <div key={item.tela}>
                {mostraGrupo && <div className="grupo">{item.grupo}</div>}

                <button
                  className={ativo ? 'nav ativo' : 'nav'}
                  onClick={() => navegar(item.tela)}
                >
                  <i>{item.icone}</i>
                  {item.nome}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="usuario">
          <b>EN</b>
          <div>
            <strong>Elson Neto</strong>
            <span>{sessao.user.email || 'Usuário autenticado'}</span>
          </div>
          <button
            type="button"
            onClick={sairDoSistema}
            title="Sair do sistema"
            style={{
              marginLeft: 'auto',
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ↪
          </button>
        </div>
      </aside>

      <main>
        {tela !== 'Painel' && (
          <header>
            <div>
              <span className="online">● SISTEMA OPERACIONAL</span>

              <h1>{tituloPagina()}</h1>

              <p>Agricultura, pecuária, florestas e gestão integradas.</p>
            </div>

            <button className="refresh" onClick={carregarResumo}>
              ↻
            </button>
          </header>
        )}

        {tela === 'Painel' && (
          <Painel
            resumo={resumo}
            navegar={navegar}
            clientes={clientes}
            fazendas={fazendas}
          />
        )}

        {tela === 'Clientes' && (
          <Clientes
            clientes={clientesFiltrados}
            busca={busca}
            setBusca={setBusca}
            carregando={carregando}
            erro={erro}
            abrirCliente={abrirCliente}
            fazendas={fazendas}
          />
        )}

        {tela === 'Cliente' && clienteSelecionado && (
          <Cliente
            cliente={clienteSelecionado}
            fazendas={fazendasCliente}
            abrirPropriedade={abrirPropriedade}
            voltar={() => setTela('Clientes')}
            logoAtualizada={(logoUrl: string | null) => {
              setClienteSelecionado((anterior) =>
                anterior ? { ...anterior, logo_url: logoUrl } : anterior
              );
              setClientes((lista) =>
                lista.map((c) =>
                  c.id === clienteSelecionado.id
                    ? { ...c, logo_url: logoUrl }
                    : c
                )
              );
            }}
          />
        )}

        {tela === 'Propriedade' && fazendaSelecionada && (
          <Propriedade
            fazenda={fazendaSelecionada}
            cliente={clienteSelecionado}
            resumo={resumoFazenda}
            carregando={carregando}
            abrirAgricultura={abrirAgricultura}
            navegar={navegar}
            voltar={() => setTela('Cliente')}
          />
        )}

        {tela === 'Agricultura' && (
          <Agricultura
            fazenda={fazendaSelecionada}
            talhoes={talhoesAgricultura}
            planejamentos={planejamentos}
            plantios={plantios}
            producoes={producoes}
            carregando={carregando}
            abrirTalhao={abrirTalhao}
            voltar={() =>
              fazendaSelecionada ? setTela('Propriedade') : setTela('Painel')
            }
          />
        )}

        {tela === 'Talhão' && talhaoSelecionado && (
          <FichaTalhao
            talhao={talhaoSelecionado}
            fazenda={fazendaSelecionada}
            dados={dadosTalhao}
            carregando={carregando}
            mensagemSucesso={mensagemSucesso}
            abrirPlanejamento={abrirNovoPlanejamento}
            voltar={() => setTela('Agricultura')}
          />
        )}

        {tela === 'Planejamento' && talhaoSelecionado && fazendaSelecionada && (
          <Planejamento
            talhao={talhaoSelecionado}
            fazenda={fazendaSelecionada}
            form={formPlanejamento}
            setForm={setFormPlanejamento}
            salvar={salvarPlanejamento}
            salvando={salvando}
            erro={erro}
            existente={dadosTalhao.planejamentos[0] || null}
            voltar={() => setTela('Talhão')}
          />
        )}

        {tela === 'Produção' && <Producao />}

        {tela === 'Pragas' && <MonitoramentoPragas />}

        {tela === 'Auditorias' && <Auditorias />}

        {![
          'Painel',
          'Clientes',
          'Cliente',
          'Propriedade',
          'Agricultura',
          'Talhão',
          'Planejamento',
          'Produção',
          'Pragas',
          'Auditorias',
        ].includes(tela) && <Modulo tela={tela} />}
      </main>
    </div>
  );
}

function RelatorioPublicoBroca({ token }: { token: string }) {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [midias, setMidias] = useState<Record<string, string>>({});

  const dataBRPublica = (valor: any) => {
    if (!valor) return '—';
    const p = String(valor).slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(valor);
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      const { data, error } = await supabase.rpc('relatorio_publico_broca', { p_token: token });
      if (!ativo) return;
      if (error || !data?.sucesso) {
        setErro(error?.message || data?.erro || 'Relatório não encontrado.');
        setCarregando(false);
        return;
      }
      setDados(data);

      const evidencias = (data.apontamentos || []).flatMap((a: any) => a.evidencias || []);
      const urls: Record<string, string> = {};
      for (const e of evidencias) {
        const autorizado = await supabase.rpc('relatorio_publico_evidencia', {
          p_token: token,
          p_evidencia_id: e.id,
        });
        const path = autorizado.data?.evidencia?.storage_path;
        if (!path) continue;
        const signed = await supabase.storage.from('broca-evidencias').createSignedUrl(path, 3600);
        if (signed.data?.signedUrl) urls[e.id] = signed.data.signedUrl;
      }
      if (ativo) setMidias(urls);
      setCarregando(false);
    })();
    return () => { ativo = false; };
  }, [token]);

  if (carregando) return <div className="rp-shell"><div className="rp-loading">Carregando relatório...</div></div>;
  if (erro) return <div className="rp-shell"><div className="rp-erro"><h2>Relatório indisponível</h2><p>{erro}</p></div></div>;

  const itens = dados?.apontamentos || [];
  const programadas = itens.reduce((t: number, x: any) => t + Math.ceil(Number(x.armadilhas_programadas || 0)), 0);
  const instaladas = itens.reduce((t: number, x: any) => t + Number(x.armadilhas_instaladas || 0), 0);
  const executados = itens.filter((x: any) => x.status_soltura === 'Executado').length;
  const parciais = itens.filter((x: any) => x.status_soltura === 'Parcial').length;
  const naoExecutados = itens.filter((x: any) => x.status_soltura === 'Não executado').length;

  return (
    <div className="rp-shell">
      <style>{css}</style>
      <main className="rp-page">
        <header className="rp-header">
          <div className="rp-logo-box rp-logo-souza">
            <img src="/Logo Souza Silva.jpeg" alt="Souza Silva" />
          </div>
          <div className="rp-header-conteudo"><small>SOUZA SILVA • GESTÃO, TECNOLOGIA E CONSULTORIA AGRÍCOLA</small><h1>{dados.relatorio?.titulo || 'Relatório de Monitoramento de Broca-da-Cana • Soltura'}</h1><p><b>Cliente:</b> {dados.cliente?.nome || 'Cliente'} • <b>Safra:</b> {dados.relatorio?.safra || '—'}</p></div>
          {dados.cliente?.logo_url && (
            <div className="rp-logo-box rp-logo-cliente">
              <img src={dados.cliente.logo_url} alt={`Logo ${dados.cliente?.nome || 'Cliente'}`} />
            </div>
          )}
          <button onClick={() => window.print()}>Imprimir / PDF</button>
        </header>
        <section className="rp-kpis">
          <article><span>Programadas</span><strong>{programadas}</strong><small>armadilhas</small></article>
          <article><span>Instaladas</span><strong>{instaladas}</strong><small>armadilhas</small></article>
          <article><span>Executados</span><strong>{executados}</strong><small>apontamentos</small></article>
          <article><span>Parciais</span><strong>{parciais}</strong><small>apontamentos</small></article>
          <article><span>Não executados</span><strong>{naoExecutados}</strong><small>apontamentos</small></article>
        </section>
        <section className="rp-card">
          <div className="rp-title"><div><small>BROCA-DA-CANA • SOLTURA</small><h2>Execução de campo</h2></div><span>{dataBRPublica(dados.relatorio?.data_inicio)} a {dataBRPublica(dados.relatorio?.data_fim)}</span></div>
          <div className="rp-table-wrap"><table><thead><tr><th>Cód.</th><th>Fazenda</th><th>Talhões</th><th>Área</th><th>Programadas</th><th>Instaladas</th><th>Responsável</th><th>Situação</th><th>Justificativa</th></tr></thead><tbody>
            {itens.map((x: any) => <tr key={x.id}><td><b>{x.codigo || '—'}</b></td><td>{x.fazenda || '—'}</td><td>{x.talhoes || '—'}</td><td>{Number(x.area_ha || 0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} ha</td><td>{Math.ceil(Number(x.armadilhas_programadas || 0))}</td><td>{Number(x.armadilhas_instaladas || 0)}</td><td>{x.responsavel_soltura || '—'}</td><td><span className={`rp-status ${x.status_soltura === 'Não executado' ? 'nao' : x.status_soltura === 'Parcial' ? 'parcial' : 'ok'}`}>{x.status_soltura || 'Pendente'}</span></td><td>{x.justificativa || '—'}</td></tr>)}
          </tbody></table></div>
        </section>
        {itens.some((x:any)=>(x.evidencias||[]).length) && <section className="rp-card"><div className="rp-title"><div><small>EVIDÊNCIAS</small><h2>Fotos e vídeos da operação</h2></div></div><div className="rp-galeria">
          {itens.flatMap((x:any)=>(x.evidencias||[]).map((e:any)=>({ ...e, fazenda:x.fazenda, codigo:x.codigo }))).map((e:any)=><article key={e.id}><div className="rp-media">{midias[e.id] ? (String(e.mime_type||'').startsWith('video/') || String(e.tipo||'').toLowerCase().includes('video') ? <video src={midias[e.id]} controls preload="metadata" /> : <img src={midias[e.id]} alt={e.legenda || e.nome_arquivo || 'Evidência'} />) : <div className="rp-media-protegida">🔒<span>Evidência protegida</span><small>{e.nome_arquivo || 'Arquivo'}</small></div>}</div><b>{e.codigo ? `${e.codigo} • ` : ''}{e.fazenda}</b><span>{e.legenda || e.nome_arquivo || e.tipo}</span></article>)}
        </div></section>}
        <footer className="rp-footer"><div><b>Souza Silva</b><span>Gestão, Tecnologia e Consultoria Agrícola</span></div><div><span>Relatório eletrônico de consulta</span><small>Link individual e somente leitura</small></div></footer>
      </main>
    </div>
  );
}

function Painel({ resumo, navegar, clientes, fazendas }: any) {
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [clienteId, setClienteId] = useState('');
  const [fazendaId, setFazendaId] = useState('');
  const [cultura, setCultura] = useState('');
  const [safra, setSafra] = useState('2026/2027');
  const [talhoesPainel, setTalhoesPainel] = useState<Registro[]>([]);
  const [areasPainel, setAreasPainel] = useState<Registro[]>([]);
  const [glebasPainel, setGlebasPainel] = useState<Registro[]>([]);
  const [brocaPainel, setBrocaPainel] = useState<Registro[]>([]);
  const [carregandoPainel, setCarregandoPainel] = useState(true);

  async function carregarDadosPainel() {
    setCarregandoPainel(true);
    const [talh, geo, gl, fgl, broca] = await Promise.all([
      supabase.from('talhoes').select('*'),
      supabase.from('areas_geograficas').select('*'),
      supabase.from('glebas').select('*'),
      supabase.from('fazendas_glebas').select('*'),
      supabase.from('broca_monitoramentos').select('*').eq('ativo', true),
    ]);
    setTalhoesPainel(talh.data ?? []);
    setAreasPainel(geo.data ?? []);
    setGlebasPainel((gl.data?.length ? gl.data : fgl.data) ?? []);
    setBrocaPainel(broca.data ?? []);
    setCarregandoPainel(false);
  }

  useEffect(() => {
    carregarDadosPainel();
  }, []);

  const fazendasFiltradasCliente = useMemo(
    () =>
      fazendas.filter(
        (f: Registro) => !clienteId || f.cliente_id === clienteId
      ),
    [fazendas, clienteId]
  );

  const culturas = useMemo(
    () =>
      Array.from(
        new Set(
          talhoesPainel
            .map((x: Registro) => String(x.cultura ?? '').trim())
            .filter(Boolean)
        )
      ).sort(),
    [talhoesPainel]
  );

  const talhoesBase = useMemo(
    () =>
      talhoesPainel.filter((talhao: Registro) => {
        const fazenda = fazendas.find(
          (f: Registro) => f.id === talhao.fazenda_id
        );
        if (clienteId && fazenda?.cliente_id !== clienteId) return false;
        if (fazendaId && talhao.fazenda_id !== fazendaId) return false;
        if (
          cultura &&
          String(talhao.cultura ?? '').toLowerCase() !== cultura.toLowerCase()
        )
          return false;
        if (safra && talhao.safra && String(talhao.safra) !== safra)
          return false;
        return true;
      }),
    [talhoesPainel, fazendas, clienteId, fazendaId, cultura, safra]
  );

  const idsTalhoes = useMemo(
    () => new Set(talhoesBase.map((x: Registro) => x.id)),
    [talhoesBase]
  );
  const fazendasBase = useMemo(() => {
    if (fazendaId) return fazendas.filter((f: Registro) => f.id === fazendaId);
    if (clienteId)
      return fazendas.filter((f: Registro) => f.cliente_id === clienteId);
    return fazendas;
  }, [fazendas, clienteId, fazendaId]);

  const glebasBase = useMemo(
    () =>
      glebasPainel.filter((g: Registro) => {
        if (fazendaId && g.fazenda_id !== fazendaId) return false;
        if (clienteId && g.cliente_id && g.cliente_id !== clienteId)
          return false;
        return true;
      }),
    [glebasPainel, clienteId, fazendaId]
  );

  const areasBase = useMemo(
    () =>
      areasPainel.filter((a: Registro) => {
        if (fazendaId && a.fazenda_id !== fazendaId) return false;
        if (clienteId && a.cliente_id && a.cliente_id !== clienteId)
          return false;
        if (a.talhao_id && idsTalhoes.size && !idsTalhoes.has(a.talhao_id))
          return false;
        return true;
      }),
    [areasPainel, clienteId, fazendaId, idsTalhoes]
  );

  const areaTotal = useMemo(() => {
    const porTalhao = talhoesBase.reduce(
      (s: number, x: Registro) => s + Number(x.area_ha || x.area_total_ha || 0),
      0
    );
    if (porTalhao > 0) return porTalhao;
    return fazendasBase.reduce(
      (s: number, x: Registro) => s + Number(x.area_ha || x.area_total_ha || 0),
      0
    );
  }, [talhoesBase, fazendasBase]);

  const resumoAtual = {
    clientes: clienteId ? 1 : resumo.clientes,
    fazendas: fazendasBase.length,
    glebas: clienteId || fazendaId ? glebasBase.length : resumo.glebas,
    talhoes:
      clienteId || fazendaId || cultura ? talhoesBase.length : resumo.talhoes,
  };

  const poligonos = useMemo(() => {
    const geometrias: { area: Registro; aneis: any[][][] }[] = [];
    areasBase.forEach((area: Registro) => {
      try {
        const geo =
          typeof area.geometria_geojson === 'string'
            ? JSON.parse(area.geometria_geojson)
            : area.geometria_geojson;
        const geometria = geo?.type === 'Feature' ? geo.geometry : geo;
        if (geometria?.type === 'Polygon')
          geometrias.push({ area, aneis: [geometria.coordinates] });
        if (geometria?.type === 'MultiPolygon')
          geometrias.push({ area, aneis: geometria.coordinates });
      } catch {}
    });
    const pts: number[][] = [];
    geometrias.forEach((g) =>
      g.aneis.forEach((pol) =>
        pol.forEach((anel) =>
          anel.forEach((p: any) => {
            if (
              Array.isArray(p) &&
              typeof p[0] === 'number' &&
              typeof p[1] === 'number'
            )
              pts.push([p[0], p[1]]);
          })
        )
      )
    );
    if (!pts.length) return [];
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const dx = Math.max(maxX - minX, 0.000001),
      dy = Math.max(maxY - minY, 0.000001),
      W = 900,
      H = 470,
      pad = 24;
    const esc = Math.min((W - pad * 2) / dx, (H - pad * 2) / dy),
      ox = (W - dx * esc) / 2,
      oy = (H - dy * esc) / 2;
    const proj = (anel: any[]) =>
      anel
        .map(
          (p: any) =>
            `${(ox + (p[0] - minX) * esc).toFixed(1)},${(
              H -
              (oy + (p[1] - minY) * esc)
            ).toFixed(1)}`
        )
        .join(' ');
    const out: any[] = [];
    geometrias.forEach((g, gi) =>
      g.aneis.forEach((pol, pi) => {
        if (pol?.[0]?.length)
          out.push({
            key: `${g.area.id}-${gi}-${pi}`,
            pontos: proj(pol[0]),
            area: g.area,
          });
      })
    );
    return out;
  }, [areasBase]);

  const brocaBase = useMemo(
    () =>
      brocaPainel.filter((x: Registro) => {
        if (safra && x.safra && String(x.safra) !== safra) return false;
        if (fazendaId && x.fazenda_id !== fazendaId) return false;
        if (clienteId && x.cliente_id !== clienteId) return false;
        return true;
      }),
    [brocaPainel, safra, fazendaId, clienteId]
  );

  const brocaAbertos = brocaBase.filter(
    (x: Registro) => x.data_soltura && !x.data_levantamento
  ).length;
  const brocaConcluidosPainel = brocaBase.filter(
    (x: Registro) => x.data_levantamento && x.mariposas != null
  ).length;
  const propriedadesMapeadas = new Set(
    areasBase.map((x: Registro) => x.fazenda_id).filter(Boolean)
  ).size;

  const areaFmt = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(areaTotal);
  const nomeEscopo = fazendaId
    ? fazendas.find((f: Registro) => f.id === fazendaId)?.nome
    : clienteId
    ? clientes.find((c: Registro) => c.id === clienteId)?.nome
    : 'Todas as operações';

  return (
    <div className="command-center">
      <section className="cc-topo">
        <div className="cc-topo-identidade">
          <strong>Gestão e Inteligência Agrícola</strong>
          <span>Dados • Planejamento • Controle • Resultados</span>
        </div>
        <div className="cc-busca">
          ⌕ <span>Buscar cliente, fazenda, gleba, talhão...</span>
        </div>
        <button className="cc-alerta">
          ♧<i>3</i>
        </button>
        <div className="cc-usuario">
          <b>EN</b>
          <div>
            <strong>Elson Neto</strong>
            <span>Administrador</span>
          </div>
        </div>
        <div className="cc-data">
          <b>▣</b>
          <div>
            <span>{hoje.split(',')[0]}</span>
            <strong>{hoje.split(',').slice(1).join(',')}</strong>
          </div>
        </div>
      </section>

      <section className="cc-filtros">
        <label>
          <span>Cliente</span>
          <select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setFazendaId('');
            }}
          >
            <option value="">Todos os clientes</option>
            {clientes.map((x: Registro) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fazenda</span>
          <select
            value={fazendaId}
            onChange={(e) => setFazendaId(e.target.value)}
          >
            <option value="">Todas as fazendas</option>
            {fazendasFiltradasCliente.map((x: Registro) => (
              <option key={x.id} value={x.id}>
                {x.codigo ? `${x.codigo} • ` : ''}
                {x.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Cultura</span>
          <select value={cultura} onChange={(e) => setCultura(e.target.value)}>
            <option value="">Todas as culturas</option>
            {culturas.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Safra</span>
          <select value={safra} onChange={(e) => setSafra(e.target.value)}>
            <option>2026/2027</option>
            <option>2027/2028</option>
            <option value="">Todas</option>
          </select>
        </label>
        <button onClick={carregarDadosPainel}>
          ↻ <span>Atualizar dados</span>
        </button>
      </section>

      <section className="cc-kpis">
        <button onClick={() => navegar('Clientes')} className="cc-kpi k-verde">
          <i>♙</i>
          <div>
            <span>Clientes</span>
            <strong>{resumoAtual.clientes}</strong>
            <small>Total cadastrado</small>
          </div>
        </button>
        <button onClick={() => navegar('Fazendas')} className="cc-kpi k-azul">
          <i>⌂</i>
          <div>
            <span>Fazendas</span>
            <strong>{resumoAtual.fazendas}</strong>
            <small>Total cadastrado</small>
          </div>
        </button>
        <button onClick={() => navegar('Glebas')} className="cc-kpi k-ouro">
          <i>◇</i>
          <div>
            <span>Glebas</span>
            <strong>{resumoAtual.glebas}</strong>
            <small>Total cadastrado</small>
          </div>
        </button>
        <button onClick={() => navegar('Talhões')} className="cc-kpi k-ciano">
          <i>♧</i>
          <div>
            <span>Talhões</span>
            <strong>{resumoAtual.talhoes}</strong>
            <small>Total cadastrado</small>
          </div>
        </button>
        <button onClick={() => navegar('Áreas')} className="cc-kpi k-roxo">
          <i>▧</i>
          <div>
            <span>Áreas</span>
            <strong>{areaTotal ? `${areaFmt} ha` : '—'}</strong>
            <small>
              {areaTotal ? 'Área cadastrada' : 'Sem área consolidada'}
            </small>
          </div>
        </button>
      </section>

      <section className="cc-operacao-faixa">
        <button
          onClick={() => navegar('Pragas')}
          className="cc-op-card cc-op-destaque"
        >
          <span>MONITORAMENTO DE PRAGAS</span>
          <strong>{brocaAbertos}</strong>
          <small>Broca aguardando recolhimento</small>
          <em>Abrir operação →</em>
        </button>
        <div className="cc-op-card">
          <span>BROCA CONCLUÍDA</span>
          <strong>{brocaConcluidosPainel}</strong>
          <small>levantamentos na safra/filtro</small>
        </div>
        <div className="cc-op-card">
          <span>MAPEAMENTO</span>
          <strong>{areasBase.length}</strong>
          <small>áreas geográficas • {propriedadesMapeadas} propriedades</small>
        </div>
        <div className="cc-op-card">
          <span>BASE AGRÍCOLA</span>
          <strong>{resumoAtual.talhoes}</strong>
          <small>talhões no escopo selecionado</small>
        </div>
      </section>

      <section
        className={`cc-corpo ${
          poligonos.length ? 'cc-com-geometria' : 'cc-sem-geometria'
        }`}
      >
        <div className="cc-col-esquerda">
          <article
            className={`cc-card cc-mapa ${
              poligonos.length ? 'tem-geometria' : 'sem-geometria'
            }`}
          >
            <header>
              <strong>◩ &nbsp; Mapa das Fazendas</strong>
              <div>
                <button>Satélite</button>
                <button>Mapa</button>
                <button>Talhões</button>
                <button>⛶</button>
              </div>
            </header>
            <div className="cc-mapa-canvas">
              {poligonos.length ? (
                <svg viewBox="0 0 900 470" preserveAspectRatio="xMidYMid meet">
                  {poligonos.map((p: any, i: number) => (
                    <polygon
                      key={p.key}
                      className={`p${i % 5}`}
                      points={p.pontos}
                    >
                      <title>
                        {p.area.nome || p.area.talhao_kml || 'Área cadastrada'}
                      </title>
                    </polygon>
                  ))}
                </svg>
              ) : (
                <div className="cc-sem-dados">
                  <b>⌖</b>
                  <strong>Sem geometria neste filtro</strong>
                  <span>Os polígonos cadastrados aparecerão aqui.</span>
                </div>
              )}
              <div className="cc-mapa-info">
                <b>{nomeEscopo}</b>
                <span>{areasBase.length} área(s) geográfica(s)</span>
              </div>
              <div className="cc-mapa-legenda">
                <span>
                  <i className="l1"></i> Cana / áreas
                </span>
                <span>
                  <i className="l2"></i> Soja
                </span>
                <span>
                  <i className="l3"></i> Outros usos
                </span>
              </div>
            </div>
          </article>

          <div className="cc-dupla">
            <article className="cc-card">
              <header>
                <strong>✣ &nbsp; Monitoramento de Pragas</strong>
                <button onClick={() => navegar('Pragas')}>Abrir →</button>
              </header>
              <div className="cc-pragas">
                <div>
                  <span>Broca-da-cana</span>
                  <strong>{brocaAbertos} em aberto</strong>
                  <small>{brocaConcluidosPainel} concluídos no filtro</small>
                </div>
                <div>
                  <span>Sphenophorus</span>
                  <strong>Histórico</strong>
                  <small>Levantamentos e indicadores</small>
                </div>
              </div>
            </article>
            <article className="cc-card">
              <header>
                <strong>◈ &nbsp; Status de Auditorias e Certificações</strong>
                <button onClick={() => navegar('Certificações')}>
                  Abrir →
                </button>
              </header>
              <div className="cc-cert">
                <div>
                  <b>◉</b>
                  <strong>RenovaBio</strong>
                  <em>Consultar módulo</em>
                </div>
                <div>
                  <b>♧</b>
                  <strong>Bonsucro</strong>
                  <em>Consultar módulo</em>
                </div>
              </div>
            </article>
          </div>

          <div className="cc-tripla">
            <article className="cc-card cc-mini">
              <header>
                <strong>◆ &nbsp; Frota em operação hoje</strong>
              </header>
              <div className="cc-vazio">
                <b>—</b>
                <span>Dados operacionais ainda não ligados ao painel</span>
              </div>
            </article>
            <article className="cc-card cc-mini">
              <header>
                <strong>▣ &nbsp; Atividades da Semana</strong>
              </header>
              <div className="cc-ativ">
                <div>
                  <span>Programação Broca</span>
                  <b>Em andamento</b>
                </div>
                <div>
                  <span>Manejo / Aplicações</span>
                  <em>Consultar módulo</em>
                </div>
                <div>
                  <span>Plantio / Planejamento</span>
                  <em>Consultar módulo</em>
                </div>
              </div>
            </article>
            <article className="cc-card cc-mini">
              <header>
                <strong>▥ &nbsp; Cotações</strong>
              </header>
              <div className="cc-vazio">
                <b>—</b>
                <span>Fonte de mercado ainda não ligada ao painel</span>
              </div>
            </article>
          </div>
        </div>

        <div className="cc-col-direita">
          <article className="cc-card">
            <header>
              <strong>⌁ &nbsp; Área por Cultura</strong>
              <small>DADOS CADASTRADOS</small>
            </header>
            <div className="cc-donut-wrap">
              <div className="cc-donut">
                <strong>{areaTotal ? areaFmt : '—'}</strong>
                <span>hectares</span>
              </div>
              <div className="cc-donut-list">
                <div>
                  <i></i>
                  <span>Talhões</span>
                  <b>{resumoAtual.talhoes}</b>
                </div>
                <div>
                  <i></i>
                  <span>Áreas mapeadas</span>
                  <b>{areasBase.length}</b>
                </div>
                <div>
                  <i></i>
                  <span>Fazendas</span>
                  <b>{resumoAtual.fazendas}</b>
                </div>
              </div>
            </div>
          </article>

          <article className="cc-card cc-inteligencia">
            <header>
              <strong>✦ &nbsp; Inteligência Souza Silva</strong>
              <small>LEITURA DO PAINEL</small>
            </header>
            <div className={`cc-insight ${brocaAbertos ? 'at' : 'ok'}`}>
              <b>{brocaAbertos ? '!' : '✓'}</b>
              <div>
                <strong>
                  {brocaAbertos
                    ? `${brocaAbertos} recolhimentos de Broca em aberto`
                    : 'Broca sem pendências abertas'}
                </strong>
                <span>
                  Leitura automática dos registros ativos da safra selecionada.
                </span>
              </div>
            </div>
            <div className={`cc-insight ${poligonos.length ? 'ok' : 'at'}`}>
              <b>{poligonos.length ? '↑' : '!'}</b>
              <div>
                <strong>
                  {areasBase.length} áreas geográficas cadastradas
                </strong>
                <span>
                  {poligonos.length
                    ? `${propriedadesMapeadas} propriedades com geometria no escopo.`
                    : 'Ainda não há geometria disponível neste filtro.'}
                </span>
              </div>
            </div>
            <div className="cc-insight info">
              <b>↘</b>
              <div>
                <strong>
                  {resumoAtual.talhoes} talhões • {resumoAtual.fazendas}{' '}
                  fazendas
                </strong>
                <span>Base agrícola respondendo aos filtros do painel.</span>
              </div>
            </div>
          </article>

          <article className="cc-card cc-mini">
            <header>
              <strong>☀ &nbsp; Clima</strong>
              <small>NÃO CONECTADO</small>
            </header>
            <div className="cc-vazio">
              <b>—</b>
              <span>Conectaremos uma fonte meteorológica depois.</span>
            </div>
          </article>
        </div>
      </section>
      {carregandoPainel && (
        <div className="cc-loading">Atualizando painel...</div>
      )}
    </div>
  );
}

function Clientes({
  clientes,
  busca,
  setBusca,
  carregando,
  erro,
  abrirCliente,
  fazendas,
}: any) {
  return (
    <section className="painel">
      <div className="titulo">
        <div>
          <span>CADASTROS</span>
          <h2>Clientes</h2>
          <p>Selecione um cliente para acessar suas propriedades.</p>
        </div>

        <input
          value={busca}
          placeholder="Buscar cliente..."
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando && <Mensagem texto="Carregando clientes..." />}

      {erro && <div className="erro-box">{erro}</div>}

      <div className="grade">
        {clientes.map((cliente: Registro) => (
          <article className="card" key={cliente.id}>
            <span>CLIENTE</span>
            <h3>{cliente.nome}</h3>

            <p>{cliente.municipio || 'Município não informado'}</p>

            <div className="linha">
              <span>Propriedades</span>

              <strong>
                {
                  fazendas.filter((f: Registro) => f.cliente_id === cliente.id)
                    .length
                }
              </strong>
            </div>

            <button onClick={() => abrirCliente(cliente)}>
              Abrir cliente →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Cliente({
  cliente,
  fazendas,
  abrirPropriedade,
  voltar,
  logoAtualizada,
}: any) {
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erroLogo, setErroLogo] = useState('');
  const [sucessoLogo, setSucessoLogo] = useState('');

  async function enviarLogoCliente(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const tiposPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    if (!tiposPermitidos.includes(arquivo.type)) {
      setErroLogo('Use uma imagem PNG, JPG, WEBP ou SVG.');
      event.target.value = '';
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroLogo('A logo deve ter no máximo 5 MB.');
      event.target.value = '';
      return;
    }

    setEnviandoLogo(true);
    setErroLogo('');
    setSucessoLogo('');

    const extensao = (arquivo.name.split('.').pop() || 'png')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const caminho = `${cliente.id}/logo-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from('logos-clientes')
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false,
        contentType: arquivo.type,
      });

    if (erroUpload) {
      setErroLogo(erroUpload.message);
      setEnviandoLogo(false);
      event.target.value = '';
      return;
    }

    const { data: publica } = supabase.storage
      .from('logos-clientes')
      .getPublicUrl(caminho);
    const logoUrl = publica.publicUrl;

    const { error: erroBanco } = await supabase
      .from('clientes')
      .update({ logo_url: logoUrl })
      .eq('id', cliente.id);

    if (erroBanco) {
      await supabase.storage.from('logos-clientes').remove([caminho]);
      setErroLogo(erroBanco.message);
      setEnviandoLogo(false);
      event.target.value = '';
      return;
    }

    logoAtualizada?.(logoUrl);
    setSucessoLogo('Logo atualizada com sucesso.');
    setEnviandoLogo(false);
    event.target.value = '';
  }

  async function removerLogoCliente() {
    const logoAtual = cliente.logo_url;
    if (!logoAtual) return;

    setEnviandoLogo(true);
    setErroLogo('');
    setSucessoLogo('');

    const { error } = await supabase
      .from('clientes')
      .update({ logo_url: null })
      .eq('id', cliente.id);

    if (error) {
      setErroLogo(error.message);
      setEnviandoLogo(false);
      return;
    }

    const marcador = '/logos-clientes/';
    const indice = String(logoAtual).indexOf(marcador);
    if (indice >= 0) {
      const caminho = decodeURIComponent(
        String(logoAtual).slice(indice + marcador.length)
      );
      if (caminho)
        await supabase.storage.from('logos-clientes').remove([caminho]);
    }

    logoAtualizada?.(null);
    setSucessoLogo('Logo removida.');
    setEnviandoLogo(false);
  }

  return (
    <>
      <button className="voltar" onClick={voltar}>
        ← Voltar
      </button>

      <section className="faixa">
        <span>CLIENTE</span>
        <h2>{cliente.nome}</h2>
        <p>Gestão integrada das propriedades.</p>
      </section>

      <section className="painel cliente-identidade">
        <div className="titulo">
          <div>
            <span>IDENTIDADE DO CLIENTE</span>
            <h2>Logo para dashboards e relatórios</h2>
            <p>
              A imagem cadastrada aqui será usada automaticamente nos documentos
              deste cliente.
            </p>
          </div>
        </div>
        <div className="cliente-logo-box">
          <div className="cliente-logo-preview">
            {cliente.logo_url ? (
              <img src={cliente.logo_url} alt={`Logo ${cliente.nome}`} />
            ) : (
              <div className="cliente-logo-vazia">
                <strong>
                  {String(cliente.nome || 'C')
                    .charAt(0)
                    .toUpperCase()}
                </strong>
                <span>SEM LOGO CADASTRADA</span>
              </div>
            )}
          </div>
          <div className="cliente-logo-acoes">
            <strong>{cliente.nome}</strong>
            <span>PNG, JPG, JPEG, WEBP ou SVG • máximo 5 MB</span>
            <label className="botao-verde upload-logo-cliente">
              {enviandoLogo
                ? 'Enviando...'
                : cliente.logo_url
                ? 'Trocar logo'
                : 'Enviar logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={enviandoLogo}
                onChange={enviarLogoCliente}
              />
            </label>
            {cliente.logo_url && (
              <button
                className="botao-remover-logo"
                disabled={enviandoLogo}
                onClick={removerLogoCliente}
              >
                Remover logo
              </button>
            )}
            {erroLogo && <div className="erro-box">{erroLogo}</div>}
            {sucessoLogo && <div className="sucesso-box">✓ {sucessoLogo}</div>}
          </div>
        </div>
      </section>

      <section className="painel">
        <div className="titulo">
          <div>
            <span>ESTRUTURA PRODUTIVA</span>

            <h2>Fazendas vinculadas</h2>
          </div>
        </div>

        <div className="grade">
          {fazendas.map((fazenda: Registro) => (
            <article className="fazenda" key={fazenda.id}>
              <div className="capa">
                <span>PROPRIEDADE RURAL</span>
                <b>⌂</b>
              </div>

              <div className="fazenda-body">
                <span>FAZENDA</span>
                <h3>{fazenda.nome}</h3>

                <div className="duas">
                  <div>
                    <small>MUNICÍPIO</small>
                    <strong>{fazenda.municipio || '—'}</strong>
                  </div>

                  <div>
                    <small>ÁREA</small>
                    <strong>
                      {(fazenda.area_total_ha ?? fazenda.area_ha) != null
                        ? `${fazenda.area_total_ha ?? fazenda.area_ha} ha`
                        : '—'}
                    </strong>
                  </div>
                </div>

                <div className="tags">
                  <span>Agricultura</span>
                  <span>Pecuária</span>
                  <span>Florestas</span>
                </div>

                <button onClick={() => abrirPropriedade(fazenda)}>
                  Abrir propriedade →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Propriedade({
  fazenda,
  cliente,
  resumo,
  carregando,
  abrirAgricultura,
  navegar,
  voltar,
}: any) {
  return (
    <>
      <button className="voltar" onClick={voltar}>
        ← Voltar para cliente
      </button>

      <section className="propriedade">
        <div>
          <span>PROPRIEDADE RURAL</span>

          <h2>{fazenda.nome}</h2>

          <p>{fazenda.municipio || '—'}</p>
        </div>

        <div className="info-propriedade">
          <small>CLIENTE</small>
          <strong>{cliente?.nome || '—'}</strong>

          <small>ÁREA</small>
          <strong>
            {(fazenda.area_total_ha ?? fazenda.area_ha) != null
              ? `${fazenda.area_total_ha ?? fazenda.area_ha} ha`
              : '—'}
          </strong>
        </div>
      </section>

      {carregando ? (
        <Mensagem texto="Carregando propriedade..." />
      ) : (
        <>
          <div className="kpis">
            <Kpi
              titulo="Glebas"
              valor={resumo.glebas}
              onClick={() => navegar('Glebas')}
            />

            <Kpi
              titulo="Talhões"
              valor={resumo.talhoes}
              onClick={() => navegar('Talhões')}
            />

            <Kpi
              titulo="Áreas"
              valor={resumo.areas}
              onClick={() => navegar('Áreas')}
            />

            <Kpi
              titulo="Manejos"
              valor={resumo.manejos}
              onClick={() => navegar('Manejo')}
            />

            <Kpi
              titulo="Pragas"
              valor={resumo.pragas}
              onClick={() => navegar('Pragas')}
            />

            <Kpi
              titulo="Irrigação"
              valor={resumo.irrigacao}
              onClick={() => navegar('Irrigação')}
            />
          </div>

          <section className="painel">
            <div className="titulo">
              <div>
                <span>ATIVIDADES DA PROPRIEDADE</span>

                <h2>Central da Fazenda</h2>

                <p>Todos os setores vinculados a {fazenda.nome}.</p>
              </div>
            </div>

            <div className="modulos">
              <ModuloFazenda
                titulo="Agricultura"
                texto="Planejamento, plantio, manejo, produção e produtividade."
                valor={`${resumo.talhoes} talhões`}
                onClick={abrirAgricultura}
              />

              <ModuloFazenda
                titulo="Monitoramento de Pragas"
                texto="Levantamentos, incidência e histórico."
                valor={`${resumo.pragas} registros`}
                onClick={() => navegar('Pragas')}
              />

              <ModuloFazenda
                titulo="Manejo"
                texto="Aplicações, correções e rastreabilidade."
                valor={`${resumo.manejos} registros`}
                onClick={() => navegar('Manejo')}
              />

              <ModuloFazenda
                titulo="Pecuária"
                texto="Corte, leite, rebanhos, pastagens e sanidade."
                valor="Abrir módulo"
                onClick={() => navegar('Pecuária')}
              />

              <ModuloFazenda
                titulo="Florestas"
                texto="Eucalipto, seringueira, manejo e inventário."
                valor="Abrir módulo"
                onClick={() => navegar('Florestas')}
              />

              <ModuloFazenda
                titulo="Irrigação"
                texto="Pivôs, áreas irrigadas e fontes de água."
                valor={`${resumo.irrigacao} sistemas`}
                onClick={() => navegar('Irrigação')}
              />

              <ModuloFazenda
                titulo="Aviação Agrícola e Drones"
                texto="Operações aéreas, aplicações, voos, equipamentos e rastreabilidade."
                valor={`${resumo.operacoesAereas} operações`}
                onClick={() => navegar('Aviação Agrícola e Drones')}
              />
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Agricultura({
  fazenda,
  talhoes,
  planejamentos,
  plantios,
  producoes,
  carregando,
  abrirTalhao,
  voltar,
}: any) {
  const areaTotal = talhoes.reduce(
    (soma: number, t: Registro) => soma + Number(t.area_ha || 0),
    0
  );

  const culturasPlanejadas = Array.from(
    new Set(talhoes.map((t: Registro) => t.cultura).filter(Boolean))
  );

  const talhoesPlantados = new Set(
    plantios
      .map((p: Registro) => String(p.talhao_id ?? '').trim())
      .filter(Boolean)
  ).size;

  const possuiPlantios = talhoesPlantados > 0;

  return (
    <>
      <button className="voltar" onClick={voltar}>
        ← Voltar para a propriedade
      </button>

      <section className="agricultura-hero">
        <div>
          <span>AGRICULTURA</span>

          <h2>{fazenda?.nome || 'Visão Agrícola'}</h2>

          <p>Planejamento agrícola e acompanhamento dos talhões.</p>
        </div>

        <div className="agri-selo">
          <small>ESTÁGIO ATUAL</small>

          <strong>
            {possuiPlantios ? 'Plantio registrado' : 'Planejamento'}
          </strong>

          <span
            className={possuiPlantios ? 'chip-plantado' : 'status-planejado'}
          >
            {possuiPlantios
              ? `● ${talhoesPlantados} TALHÃO(ÕES) COM PLANTIO`
              : '● SEM PLANTIO REGISTRADO'}
          </span>
        </div>
      </section>

      {carregando ? (
        <Mensagem texto="Carregando dados agrícolas..." />
      ) : (
        <>
          <div className="kpis">
            <Kpi titulo="Talhões" valor={talhoes.length} onClick={() => {}} />

            <Kpi
              titulo="Área cadastrada"
              valor={Number(areaTotal.toFixed(2))}
              onClick={() => {}}
            />

            <Kpi
              titulo="Culturas planejadas"
              valor={culturasPlanejadas.length}
              onClick={() => {}}
            />

            <Kpi
              titulo="Planejamentos"
              valor={planejamentos.length}
              onClick={() => {}}
            />

            <Kpi
              titulo="Talhões plantados"
              valor={talhoesPlantados}
              onClick={() => {}}
            />

            <Kpi
              titulo="Produções"
              valor={producoes.length}
              onClick={() => {}}
            />
          </div>

          <section className="painel">
            <div className="titulo">
              <div>
                <span>PLANEJAMENTO AGRÍCOLA</span>

                <h2>Talhões da propriedade</h2>

                <p>Cultura planejada não significa cultura já implantada.</p>
              </div>

              <button className="botao-verde">+ Novo Talhão</button>
            </div>

            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Talhão</th>
                    <th>Cultura planejada</th>
                    <th>Variedade planejada</th>
                    <th>Safra</th>
                    <th>Área</th>
                    <th>Estágio</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {talhoes.map((talhao: Registro) => {
                    const possuiPlantio = plantios.some(
                      (p: Registro) =>
                        String(p.talhao_id ?? '').trim() ===
                        String(talhao.id ?? '').trim()
                    );

                    const planejamento = planejamentos.find(
                      (p: Registro) => p.talhao_id === talhao.id
                    );

                    return (
                      <tr
                        key={talhao.id}
                        className="linha-talhao"
                        onClick={() => abrirTalhao(talhao)}
                      >
                        <td>
                          <strong>{talhao.nome || 'Sem nome'}</strong>
                        </td>

                        <td>
                          {planejamento?.cultura ||
                            talhao.cultura ||
                            'A definir'}
                        </td>

                        <td>
                          {planejamento?.cultivar || talhao.variedade || '—'}
                        </td>

                        <td>{planejamento?.safra || talhao.safra || '—'}</td>

                        <td>{talhao.area_ha ? `${talhao.area_ha} ha` : '—'}</td>

                        <td>
                          {possuiPlantio ? (
                            <span className="chip-plantado">● PLANTADO</span>
                          ) : (
                            <span className="chip-planejado">
                              ● EM PLANEJAMENTO
                            </span>
                          )}
                        </td>

                        <td className="abrir">Abrir →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function FichaTalhao({
  talhao,
  fazenda,
  dados,
  carregando,
  mensagemSucesso,
  abrirPlanejamento,
  voltar,
}: any) {
  const plantado = dados.plantios.length > 0;

  const possuiProducao = dados.producoes.length > 0;

  const possuiPlanejamento = dados.planejamentos.length > 0;

  let etapa = 'Planejamento';

  if (plantado) {
    etapa = 'Plantado / Implantado';
  }

  if (plantado && dados.manejos.length > 0) {
    etapa = 'Desenvolvimento / Manejo';
  }

  if (possuiProducao) {
    etapa = 'Colheita / Produção';
  }

  const planejamento = dados.planejamentos[0];

  return (
    <>
      <button className="voltar" onClick={voltar}>
        ← Voltar para Agricultura
      </button>

      {mensagemSucesso && (
        <div className="sucesso-box">✓ {mensagemSucesso}</div>
      )}

      <section className="talhao-hero">
        <div>
          <span>FICHA DO TALHÃO</span>

          <h2>{talhao.nome}</h2>

          <p>
            {fazenda?.nome || 'Propriedade'} • {talhao.area_ha || '—'} ha
          </p>
        </div>

        <div className="etapa-atual">
          <small>ETAPA ATUAL</small>
          <strong>{etapa}</strong>

          {!plantado && <span>● PLANTIO AINDA NÃO REALIZADO</span>}
        </div>
      </section>

      {carregando ? (
        <Mensagem texto="Carregando ficha do talhão..." />
      ) : (
        <>
          <div className="fluxo">
            <Etapa
              numero="01"
              titulo="Planejamento"
              ativo={!plantado}
              concluido={possuiPlanejamento}
            />

            <Etapa
              numero="02"
              titulo="Plantio"
              ativo={false}
              concluido={plantado}
            />

            <Etapa
              numero="03"
              titulo="Desenvolvimento / Manejo"
              ativo={plantado && !possuiProducao}
              concluido={possuiProducao}
            />

            <Etapa
              numero="04"
              titulo="Colheita / Produção"
              ativo={possuiProducao}
              concluido={possuiProducao}
            />
          </div>

          <section className="painel">
            <div className="titulo">
              <div>
                <span>IDENTIFICAÇÃO</span>

                <h2>Informações do Talhão</h2>
              </div>

              <button className="botao-verde">Editar Talhão</button>
            </div>

            <div className="dados-grid">
              <Campo titulo="Propriedade" valor={fazenda?.nome || '—'} />

              <Campo titulo="Talhão" valor={talhao.nome || '—'} />

              <Campo
                titulo="Área"
                valor={talhao.area_ha ? `${talhao.area_ha} ha` : '—'}
              />

              <Campo
                titulo={plantado ? 'Cultura implantada' : 'Cultura planejada'}
                valor={planejamento?.cultura || talhao.cultura || 'A definir'}
              />

              <Campo
                titulo={plantado ? 'Cultivar' : 'Cultivar planejada'}
                valor={
                  planejamento?.cultivar || talhao.variedade || 'A definir'
                }
              />

              <Campo
                titulo="Safra"
                valor={planejamento?.safra || talhao.safra || 'A definir'}
              />
            </div>
          </section>

          <div className="talhao-modulos">
            <CardTalhao
              titulo="Planejamento"
              valor={dados.planejamentos.length}
              unidade="registros"
              texto={
                possuiPlanejamento
                  ? 'Planejamento agrícola cadastrado.'
                  : 'Cadastre cultura, safra, cultivar e previsão de plantio.'
              }
              botao={
                possuiPlanejamento
                  ? 'Ver / Editar planejamento →'
                  : 'Cadastrar planejamento →'
              }
              onClick={abrirPlanejamento}
              destaque
            />

            <CardTalhao
              titulo="Plantio"
              valor={dados.plantios.length}
              unidade="registros"
              texto={
                plantado
                  ? 'Plantio registrado para este talhão.'
                  : 'Nenhum plantio realizado até o momento.'
              }
            />

            <CardTalhao
              titulo="Manejo"
              valor={dados.manejos.length}
              unidade="operações"
              texto="Aplicações, correções e rastreabilidade."
            />

            <CardTalhao
              titulo="Monitoramento de Pragas"
              valor={dados.pragas.length}
              unidade="levantamentos"
              texto="Monitoramentos e histórico fitossanitário."
            />

            <CardTalhao
              titulo="Produção"
              valor={dados.producoes.length}
              unidade="registros"
              texto={
                possuiProducao
                  ? 'Resultados produtivos cadastrados.'
                  : 'Sem produção registrada.'
              }
            />

            <CardTalhao
              titulo="Mapas / Área Geográfica"
              valor={dados.areas.length}
              unidade="arquivos"
              texto="KML, KMZ, GeoJSON e limites geográficos."
            />
          </div>

          {!plantado && (
            <section className="aviso-planejamento">
              <div className="aviso-icone">◎</div>

              <div>
                <span>SITUAÇÃO ATUAL</span>

                <h3>Talhão em planejamento</h3>

                <p>
                  O planejamento agrícola não representa plantio realizado. O
                  talhão só mudará de etapa quando o plantio for efetivamente
                  registrado.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Planejamento({
  talhao,
  fazenda,
  form,
  setForm,
  salvar,
  salvando,
  erro,
  existente,
  voltar,
}: any) {
  function alterar(campo: keyof FormPlanejamento, valor: string) {
    setForm((anterior: FormPlanejamento) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  return (
    <>
      <button className="voltar" onClick={voltar}>
        ← Voltar para o Talhão
      </button>

      <section className="planejamento-hero">
        <div>
          <span>PLANEJAMENTO AGRÍCOLA</span>

          <h2>{talhao.nome}</h2>

          <p>
            {fazenda.nome} • {talhao.area_ha || '—'} ha
          </p>
        </div>

        <div className="planejamento-status">
          <small>SITUAÇÃO</small>

          <strong>Em planejamento</strong>

          <span>● NÃO REPRESENTA PLANTIO REALIZADO</span>
        </div>
      </section>

      <form className="painel formulario" onSubmit={salvar}>
        <div className="titulo">
          <div>
            <span>
              {existente ? 'EDITAR PLANEJAMENTO' : 'NOVO PLANEJAMENTO'}
            </span>

            <h2>Dados planejados</h2>

            <p>
              Preencha somente as informações definidas até agora. Os demais
              campos podem ficar em branco.
            </p>
          </div>
        </div>

        {erro && <div className="erro-box">{erro}</div>}

        <div className="form-grid">
          <CampoForm
            label="Safra"
            placeholder="Ex.: 2026/27"
            value={form.safra}
            onChange={(v) => alterar('safra', v)}
          />

          <CampoForm
            label="Cultura planejada *"
            placeholder="Ex.: Soja"
            value={form.cultura}
            onChange={(v) => alterar('cultura', v)}
          />

          <CampoForm
            label="Cultivar"
            placeholder="Ex.: cultivar planejada"
            value={form.cultivar}
            onChange={(v) => alterar('cultivar', v)}
          />

          <CampoForm
            label="Área planejada (ha)"
            placeholder="0,00"
            value={form.area_planejada_ha}
            onChange={(v) => alterar('area_planejada_ha', v)}
          />

          <CampoData
            label="Previsão de plantio"
            value={form.data_plantio_prevista}
            onChange={(v) => alterar('data_plantio_prevista', v)}
          />

          <CampoData
            label="Previsão de colheita"
            value={form.data_colheita_prevista}
            onChange={(v) => alterar('data_colheita_prevista', v)}
          />

          <CampoForm
            label="Sistema de plantio"
            placeholder="Ex.: Plantio direto"
            value={form.sistema_plantio}
            onChange={(v) => alterar('sistema_plantio', v)}
          />

          <CampoForm
            label="População planejada"
            placeholder="Ex.: 280000"
            value={form.populacao_planejada}
            onChange={(v) => alterar('populacao_planejada', v)}
          />

          <CampoForm
            label="Unidade da população"
            placeholder="plantas/ha"
            value={form.unidade_populacao}
            onChange={(v) => alterar('unidade_populacao', v)}
          />

          <CampoForm
            label="Espaçamento (m)"
            placeholder="Ex.: 0,50"
            value={form.espacamento_m}
            onChange={(v) => alterar('espacamento_m', v)}
          />

          <CampoForm
            label="Quantidade de semente"
            placeholder="Quantidade planejada"
            value={form.quantidade_semente}
            onChange={(v) => alterar('quantidade_semente', v)}
          />

          <CampoForm
            label="Unidade da semente"
            placeholder="kg"
            value={form.unidade_semente}
            onChange={(v) => alterar('unidade_semente', v)}
          />

          <CampoForm
            label="Finalidade"
            placeholder="Ex.: Produção de grãos"
            value={form.finalidade}
            onChange={(v) => alterar('finalidade', v)}
          />
        </div>

        <label className="campo-textarea">
          <span>Observações</span>

          <textarea
            rows={5}
            value={form.observacoes}
            placeholder="Observações sobre o planejamento..."
            onChange={(e) => alterar('observacoes', e.target.value)}
          />
        </label>

        <div className="alerta-form">
          <b>◎</b>

          <div>
            <strong>Planejamento ≠ Plantio</strong>

            <p>
              Ao salvar este formulário, o sistema registra somente o
              planejamento. Nenhuma data de plantio realizado será preenchida
              automaticamente.
            </p>
          </div>
        </div>

        <div className="acoes-form">
          <button type="button" className="botao-secundario" onClick={voltar}>
            Cancelar
          </button>

          <button type="submit" className="botao-verde" disabled={salvando}>
            {salvando
              ? 'Salvando...'
              : existente
              ? 'Salvar alterações'
              : 'Salvar planejamento'}
          </button>
        </div>
      </form>
    </>
  );
}

function CampoForm({ label, value, placeholder, onChange }: any) {
  return (
    <label className="campo-form">
      <span>{label}</span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CampoData({ label, value, onChange }: any) {
  return (
    <label className="campo-form">
      <span>{label}</span>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Etapa({ numero, titulo, ativo, concluido }: any) {
  return (
    <div
      className={`etapa ${ativo ? 'etapa-ativa' : ''} ${
        concluido ? 'etapa-concluida' : ''
      }`}
    >
      <b>{concluido ? '✓' : numero}</b>

      <div>
        <small>ETAPA {numero}</small>

        <strong>{titulo}</strong>
      </div>
    </div>
  );
}

function Campo({ titulo, valor }: any) {
  return (
    <div className="campo">
      <small>{titulo.toUpperCase()}</small>

      <strong>{String(valor)}</strong>
    </div>
  );
}

function CardTalhao({
  titulo,
  valor,
  unidade,
  texto,
  botao = 'Abrir módulo →',
  onClick,
  destaque = false,
}: any) {
  return (
    <article className={`card-talhao ${destaque ? 'card-destaque' : ''}`}>
      <span>{titulo.toUpperCase()}</span>

      <div className="numero-talhao">
        <strong>{valor}</strong>
        <small>{unidade}</small>
      </div>

      <p>{texto}</p>

      <button onClick={onClick} disabled={!onClick}>
        {botao}
      </button>
    </article>
  );
}

function ModuloFazenda({ titulo, texto, valor, onClick }: any) {
  return (
    <button className="modulo" onClick={onClick}>
      <div className="modulo-icone">✓</div>

      <div>
        <h3>{titulo}</h3>
        <p>{texto}</p>
        <span>{valor}</span>
      </div>

      <b>→</b>
    </button>
  );
}

function DashboardProducao() {
  const [carregandoDash, setCarregandoDash] = useState(true);
  const [erroDash, setErroDash] = useState('');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [talhoesDash, setTalhoesDash] = useState<Registro[]>([]);
  const [fazendasDash, setFazendasDash] = useState<Registro[]>([]);
  const [clientesDash, setClientesDash] = useState<Registro[]>([]);
  const [clienteFiltro, setClienteFiltro] = useState('todos');
  const [fazendaFiltro, setFazendaFiltro] = useState('todas');
  const [safraFiltro, setSafraFiltro] = useState('2026');
  const [areasGeoDash, setAreasGeoDash] = useState<Registro[]>([]);
  const [modoApresentacao, setModoApresentacao] = useState(false);
  const [gerandoImagem, setGerandoImagem] = useState(false);

  function gerarImagemWhatsApp() {
    setGerandoImagem(true);

    try {
      const W = 1600;
      const qtdFazendas = Math.max(porFazenda.length, 1);
      const linhasHorizontais = Math.max(qtdFazendas, 8);
      const alturaGrafico = Math.max(500, 165 + linhasHorizontais * 48);
      const yLinha2 = 353 + alturaGrafico + 20;
      const H = yLinha2 + alturaGrafico + 70;
      const esc = (s: any) =>
        String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      const top = porFazenda;
      const maxProd = Math.max(
        ...top.map((x: any) => Number(x.toneladas ?? 0)),
        1
      );
      const topTch = [...porFazenda].sort((a: any, b: any) => b.tch - a.tch);
      const maxTch = Math.max(...topTch.map((x: any) => Number(x.tch ?? 0)), 1);
      const topAtr = [...porFazenda].sort((a: any, b: any) => b.atr - a.atr);
      const maxAtr = Math.max(...topAtr.map((x: any) => Number(x.atr ?? 0)), 1);
      const topTah = [...porFazenda]
        .map((x: any) => ({ ...x, tah: (x.tch * x.atr) / 1000 }))
        .sort((a: any, b: any) => b.tah - a.tah);

      const maxTah = Math.max(...topTah.map((x: any) => Number(x.tah ?? 0)), 1);

      const barra = (
        itens: any[],
        campo: string,
        x: number,
        y: number,
        w: number,
        cor1: string,
        cor2: string,
        max: number,
        casas = 2,
        sufixo = ''
      ) =>
        itens
          .map((item: any, i: number) => {
            const yy = y + i * 48;
            const valor = Number(item[campo] ?? 0);
            const bw = Math.max((valor / max) * (w - 30), 4);
            const nome = `${item.codigo} • ${String(item.nome ?? '').replace(
              /^Fazenda\s+/i,
              ''
            )}`;
            return `
            <text x="${x}" y="${yy}" font-size="15" font-weight="700" fill="#163f34">${esc(
              nome
            )}</text>
            <text x="${
              x + w
            }" y="${yy}" text-anchor="end" font-size="15" font-weight="800" fill="${cor1}">${esc(
              fmt(valor, casas)
            )}${sufixo}</text>
            <rect x="${x}" y="${
              yy + 10
            }" width="${w}" height="9" rx="5" fill="#e8efeb"/>
            <rect x="${x}" y="${
              yy + 10
            }" width="${bw}" height="9" rx="5" fill="url(#g-${cor1.replace(
              '#',
              ''
            )})"/>
          `;
          })
          .join('');

      const colunas = (
        itens: any[],
        campo: string,
        x: number,
        y: number,
        w: number,
        h: number,
        cor1: string,
        cor2: string,
        max: number,
        casas = 2
      ) => {
        const gap = itens.length > 16 ? 5 : itens.length > 10 ? 8 : 16;
        const cw = Math.max(
          (w - gap * (itens.length - 1)) / Math.max(itens.length, 1),
          16
        );
        return itens
          .map((item: any, i: number) => {
            const valor = Number(item[campo] ?? 0);
            const bh = Math.max((valor / max) * h, 5);
            const xx = x + i * (cw + gap);
            return `
            <text x="${xx + cw / 2}" y="${
              y - 12
            }" text-anchor="middle" font-size="13" font-weight="800" fill="${cor1}">${esc(
              fmt(valor, casas)
            )}</text>
            <rect x="${xx}" y="${y}" width="${cw}" height="${h}" rx="12" fill="#e8efeb"/>
            <rect x="${xx}" y="${
              y + h - bh
            }" width="${cw}" height="${bh}" rx="12" fill="url(#g-${cor1.replace(
              '#',
              ''
            )})"/>
            <text x="${xx + cw / 2}" y="${
              y + h + 22
            }" text-anchor="middle" font-size="13" font-weight="800" fill="#163f34">${esc(
              item.codigo
            )}</text>
          `;
          })
          .join('');
      };

      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <defs>
          <linearGradient id="header" x1="0" x2="1"><stop stop-color="#0d4035"/><stop offset="1" stop-color="#348b61"/></linearGradient>
          <linearGradient id="g-176a48" x1="0" x2="1"><stop stop-color="#176a48"/><stop offset="1" stop-color="#67ad7d"/></linearGradient>
          <linearGradient id="g-246e9b" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#246e9b"/><stop offset="1" stop-color="#78b7d7"/></linearGradient>
          <linearGradient id="g-9b7312" x1="0" x2="1"><stop stop-color="#9b7312"/><stop offset="1" stop-color="#e2c052"/></linearGradient>
          <linearGradient id="g-147b75" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#147b75"/><stop offset="1" stop-color="#72c1b4"/></linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#eef4f0"/>
        <rect x="30" y="28" width="1540" height="160" rx="28" fill="url(#header)"/>
        <text x="70" y="72" font-family="Arial" font-size="20" fill="#f2c94c" font-weight="800">SOUZA SILVA • GESTÃO E INTELIGÊNCIA AGRÍCOLA</text>
        <text x="70" y="120" font-family="Arial" font-size="38" fill="white" font-weight="800">Produção de Cana-de-Açúcar</text>
        <text x="70" y="155" font-family="Arial" font-size="18" fill="#dcebe4">${esc(
          nomeCliente
        )} • Safra ${esc(safraFiltro)}</text>

        ${[
          ['PRODUÇÃO REALIZADA', `${fmt(toneladas)} t`, '239 registros'],
          ['ÁREA COLHIDA', `${fmt(area)} ha`, 'área registrada'],
          ['TCH', fmt(tch), 't cana / ha'],
          ['ATR MÉDIO', fmt(atr, 4), 'ponderado por toneladas'],
          ['TAH', fmt(tah), 'ATR × TCH / 1000'],
        ]
          .map((k, i) => {
            const x = 30 + i * 310;
            return `<rect x="${x}" y="208" width="292" height="125" rx="20" fill="white" stroke="#d9e4dd"/>
          <text x="${
            x + 146
          }" y="242" text-anchor="middle" font-family="Arial" font-size="12" fill="#71877c" font-weight="800">${
              k[0]
            }</text>
          <text x="${
            x + 146
          }" y="287" text-anchor="middle" font-family="Arial" font-size="26" fill="#123f34" font-weight="800">${esc(
              k[1]
            )}</text>
          <text x="${
            x + 146
          }" y="314" text-anchor="middle" font-family="Arial" font-size="11" fill="#438c67">${esc(
              k[2]
            )}</text>`;
          })
          .join('')}

        <rect x="30" y="353" width="760" height="${alturaGrafico}" rx="22" fill="white"/>
        <text x="62" y="390" font-family="Arial" font-size="13" fill="#176a48" font-weight="800">PRODUÇÃO</text>
        <text x="62" y="423" font-family="Arial" font-size="23" fill="#123f34" font-weight="800">Produção por Fazenda / Gleba</text>
        ${barra(
          top,
          'toneladas',
          62,
          465,
          695,
          '#176a48',
          '#67ad7d',
          maxProd,
          2,
          ' t'
        )}

        <rect x="810" y="353" width="760" height="${alturaGrafico}" rx="22" fill="white"/>
        <text x="842" y="390" font-family="Arial" font-size="13" fill="#246e9b" font-weight="800">TCH</text>
        <text x="842" y="423" font-family="Arial" font-size="23" fill="#123f34" font-weight="800">TCH por Fazenda / Gleba</text>
        ${colunas(
          topTch,
          'tch',
          850,
          500,
          680,
          Math.max(185, alturaGrafico - 210),
          '#246e9b',
          '#78b7d7',
          maxTch,
          2
        )}

        <rect x="30" y="${yLinha2}" width="760" height="${alturaGrafico}" rx="22" fill="white"/>
        <text x="62" y="${
          yLinha2 + 40
        }" font-family="Arial" font-size="13" fill="#9b7312" font-weight="800">ATR</text>
        <text x="62" y="${
          yLinha2 + 74
        }" font-family="Arial" font-size="23" fill="#123f34" font-weight="800">ATR por Fazenda / Gleba</text>
        ${barra(
          topAtr,
          'atr',
          62,
          yLinha2 + 116,
          695,
          '#9b7312',
          '#e2c052',
          maxAtr,
          4,
          ''
        )}

        <rect x="810" y="${yLinha2}" width="760" height="${alturaGrafico}" rx="22" fill="white"/>
        <text x="842" y="${
          yLinha2 + 40
        }" font-family="Arial" font-size="13" fill="#147b75" font-weight="800">TAH</text>
        <text x="842" y="${
          yLinha2 + 74
        }" font-family="Arial" font-size="23" fill="#123f34" font-weight="800">TAH por Fazenda / Gleba</text>
        ${colunas(
          topTah,
          'tah',
          850,
          yLinha2 + 145,
          680,
          Math.max(245, alturaGrafico - 230),
          '#147b75',
          '#72c1b4',
          maxTah,
          2
        )}
      </svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const link = document.createElement('a');
        link.download = `Souza-Silva-Producao-${safraFiltro}-${new Date()
          .toISOString()
          .slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setGerandoImagem(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setGerandoImagem(false);
        alert('Não foi possível montar a imagem de divulgação.');
      };

      img.src = url;
    } catch (erro: any) {
      setGerandoImagem(false);
      alert(
        `Não foi possível gerar a imagem: ${
          erro?.message ?? 'erro desconhecido'
        }`
      );
    }
  }

  async function carregarDashboard() {
    setCarregandoDash(true);
    setErroDash('');

    const [prod, talh, faz, cli, geo] = await Promise.all([
      supabase.from('producao').select('*').order('data', { ascending: true }),
      supabase.from('talhoes').select('id,fazenda_id,nome,area_ha'),
      supabase.from('fazendas').select('id,cliente_id,nome,codigo'),
      supabase.from('clientes').select('id,nome').order('nome'),
      supabase
        .from('areas_geograficas')
        .select(
          'id,cliente_id,fazenda_id,talhao_id,nome,area_ha,geometria_geojson,codigo_fazenda,talhao_kml,chave_kml'
        )
        .not('geometria_geojson', 'is', null),
    ]);

    const falha =
      prod.error || talh.error || faz.error || cli.error || geo.error;

    if (falha) {
      setErroDash(falha.message);
    } else {
      setRegistros(prod.data ?? []);
      setTalhoesDash(talh.data ?? []);
      setFazendasDash(faz.data ?? []);
      setClientesDash(cli.data ?? []);
      setAreasGeoDash(geo.data ?? []);

      const silvioJunior = (cli.data ?? []).find((c: Registro) =>
        String(c.nome ?? '')
          .toLowerCase()
          .includes('silvio de castro cunha junior')
      );

      if (silvioJunior) setClienteFiltro(silvioJunior.id);
    }

    setCarregandoDash(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const talhaoPorId = useMemo(
    () => new Map(talhoesDash.map((t: Registro) => [t.id, t])),
    [talhoesDash]
  );

  const fazendaPorId = useMemo(
    () => new Map(fazendasDash.map((f: Registro) => [f.id, f])),
    [fazendasDash]
  );

  const dados = useMemo(() => {
    return registros
      .map((p: Registro) => {
        const talhao = talhaoPorId.get(p.talhao_id);
        const fazenda = talhao ? fazendaPorId.get(talhao.fazenda_id) : null;
        return { ...p, talhao, fazenda };
      })
      .filter((p: Registro) => {
        const safraOk =
          safraFiltro === 'todas' ||
          String(p.safra ?? '').includes(safraFiltro) ||
          String(p.data ?? '').startsWith(safraFiltro);

        const clienteOk =
          clienteFiltro === 'todos' || p.fazenda?.cliente_id === clienteFiltro;

        const fazendaOk =
          fazendaFiltro === 'todas' || p.fazenda?.id === fazendaFiltro;

        return safraOk && clienteOk && fazendaOk;
      });
  }, [
    registros,
    talhaoPorId,
    fazendaPorId,
    clienteFiltro,
    fazendaFiltro,
    safraFiltro,
  ]);

  const numero = (v: any) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const area = dados.reduce(
    (s: number, p: Registro) => s + numero(p.area_colhida_ha),
    0
  );
  const toneladas = dados.reduce(
    (s: number, p: Registro) => s + numero(p.toneladas ?? p.quantidade),
    0
  );
  const tch = area > 0 ? toneladas / area : 0;

  const atrNumerador = dados.reduce(
    (s: number, p: Registro) =>
      s + numero(p.atr) * Math.max(numero(p.toneladas ?? p.quantidade), 0),
    0
  );
  const atrPeso = dados.reduce(
    (s: number, p: Registro) =>
      s + Math.max(numero(p.toneladas ?? p.quantidade), 0),
    0
  );
  const atr = atrPeso > 0 ? atrNumerador / atrPeso : 0;
  const tah = (tch * atr) / 1000;

  const porFazenda = useMemo(() => {
    const mapa = new Map<string, any>();

    dados.forEach((p: Registro) => {
      const f = p.fazenda;
      if (!f) return;
      const chave = f.id;
      const atual = mapa.get(chave) ?? {
        codigo: f.codigo ?? '—',
        nome: f.nome ?? 'Fazenda',
        area: 0,
        toneladas: 0,
        atrNum: 0,
        atrPeso: 0,
      };

      const a = numero(p.area_colhida_ha);
      const t = numero(p.toneladas ?? p.quantidade);
      atual.area += a;
      atual.toneladas += t;
      atual.atrNum += numero(p.atr) * Math.max(t, 0);
      atual.atrPeso += Math.max(t, 0);
      mapa.set(chave, atual);
    });

    return Array.from(mapa.values())
      .map((x: any) => ({
        ...x,
        tch: x.area > 0 ? x.toneladas / x.area : 0,
        atr: x.atrPeso > 0 ? x.atrNum / x.atrPeso : 0,
      }))
      .sort((a: any, b: any) => b.toneladas - a.toneladas);
  }, [dados]);

  const porMes = useMemo(() => {
    const mapa = new Map<string, any>();
    dados.forEach((p: Registro) => {
      if (!p.data) return;
      const chave = String(p.data).slice(0, 7);
      const atual = mapa.get(chave) ?? { mes: chave, area: 0, toneladas: 0 };
      atual.area += numero(p.area_colhida_ha);
      atual.toneladas += numero(p.toneladas ?? p.quantidade);
      mapa.set(chave, atual);
    });
    return Array.from(mapa.values()).sort((a: any, b: any) =>
      a.mes.localeCompare(b.mes)
    );
  }, [dados]);

  const maiorTon = Math.max(...porFazenda.map((x: any) => x.toneladas), 1);
  const maiorMes = Math.max(...porMes.map((x: any) => x.toneladas), 1);

  const fmt = (v: number, casas = 2) =>
    v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });

  const nomeCliente =
    clientesDash.find((c: Registro) => c.id === clienteFiltro)?.nome ||
    'Todos os clientes';

  const fazendasDoCliente = fazendasDash
    .filter(
      (f: Registro) =>
        clienteFiltro === 'todos' || f.cliente_id === clienteFiltro
    )
    .sort((a: Registro, b: Registro) =>
      String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'pt-BR', {
        numeric: true,
      })
    );

  const fazendaEscolhida =
    fazendaFiltro === 'todas'
      ? null
      : fazendasDash.find((f: Registro) => f.id === fazendaFiltro) ?? null;

  const areasDaFazenda = fazendaEscolhida
    ? areasGeoDash.filter((a: Registro) => a.fazenda_id === fazendaEscolhida.id)
    : [];

  const nomeFazenda = fazendaEscolhida
    ? `${fazendaEscolhida.codigo ?? '—'} • ${
        fazendaEscolhida.nome ?? 'Fazenda'
      }`
    : 'Todas as fazendas';

  return (
    <>
      <div
        className={
          modoApresentacao
            ? 'dashboard-producao apresentacao'
            : 'dashboard-producao'
        }
      >
        <section className="producao-hero producao-hero-v4">
          <div className="producao-identidade producao-identidade-v4">
            <div className="marca-v4">
              <img
                src="/Logo Souza Silva.jpeg"
                alt="Souza Silva"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="sc-marca-v4" title="Fazenda São Sebastião">
                <b>SC</b>
                <span>
                  FAZENDA
                  <br />
                  <strong>SÃO SEBASTIÃO</strong>
                </span>
              </div>
            </div>
            <div className="titulo-v4">
              <span>
                GESTÃO E INTELIGÊNCIA AGRÍCOLA • SAFRA{' '}
                {safraFiltro === 'todas' ? 'GERAL' : safraFiltro}
              </span>
              <h2>Produção de Cana-de-Açúcar</h2>
              <p>
                {nomeCliente} <i>•</i> {nomeFazenda}
              </p>
            </div>
          </div>

          <div className="dash-filtros dash-filtros-v4">
            <label>
              <small>CLIENTE</small>
              <select
                value={clienteFiltro}
                onChange={(e) => {
                  setClienteFiltro(e.target.value);
                  setFazendaFiltro('todas');
                }}
              >
                <option value="todos">Todos os clientes</option>
                {clientesDash.map((c: Registro) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <small>FAZENDA</small>
              <select
                value={fazendaFiltro}
                onChange={(e) => setFazendaFiltro(e.target.value)}
              >
                <option value="todas">Todas as fazendas</option>
                {fazendasDoCliente.map((f: Registro) => (
                  <option key={f.id} value={f.id}>
                    {f.codigo ?? '—'} • {f.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <small>SAFRA</small>
              <select
                value={safraFiltro}
                onChange={(e) => setSafraFiltro(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="todas">Todas</option>
              </select>
            </label>

            <button className="dash-atualizar" onClick={carregarDashboard}>
              ↻ Atualizar
            </button>
            <button
              className="dash-whatsapp"
              onClick={gerarImagemWhatsApp}
              disabled={gerandoImagem}
            >
              {gerandoImagem ? 'Gerando PNG...' : '▣ Imagem WhatsApp'}
            </button>
            <button
              className="dash-apresentar"
              onClick={() => setModoApresentacao(!modoApresentacao)}
            >
              {modoApresentacao ? '✕ Sair da tela cheia' : '⛶ Tela cheia'}
            </button>
          </div>
        </section>

        {carregandoDash ? (
          <Mensagem texto="Carregando produção..." />
        ) : erroDash ? (
          <div className="erro-box">{erroDash}</div>
        ) : (
          <>
            <div className="faixa-executiva-v4">
              <div>
                <span>VISÃO EXECUTIVA</span>
                <strong>{nomeFazenda}</strong>
              </div>
              <small>Dados realizados • atualização pelo Supabase</small>
            </div>
            <div className="producao-kpis producao-kpis-v4">
              <article>
                <span>PRODUÇÃO REALIZADA</span>
                <strong>{fmt(toneladas)} t</strong>
                <small>{dados.length} registros</small>
              </article>
              <article>
                <span>ÁREA COLHIDA</span>
                <strong>{fmt(area)} ha</strong>
                <small>área registrada</small>
              </article>
              <article>
                <span>TCH</span>
                <strong>{fmt(tch)}</strong>
                <small>t cana / ha</small>
              </article>
              <article>
                <span>ATR MÉDIO</span>
                <strong>{fmt(atr, 4)}</strong>
                <small>ATR realizado</small>
              </article>
              <article>
                <span>TAH</span>
                <strong>{fmt(tah)}</strong>
                <small>ATR × TCH / 1000</small>
              </article>
            </div>

            {fazendaEscolhida && (
              <MapaFazenda
                fazenda={fazendaEscolhida}
                areas={areasDaFazenda}
                producao={toneladas}
                areaColhida={area}
                tch={tch}
                atr={atr}
                tah={tah}
                fmt={fmt}
              />
            )}

            <div className="metricas-grid">
              <GraficoMetrica
                titulo="Produção por Fazenda / Gleba"
                subtitulo="Toneladas realizadas por propriedade"
                dados={porFazenda}
                campo="toneladas"
                formatar={(v: number) => `${fmt(v)} t`}
                cor="verde"
                formato="horizontal"
              />

              <GraficoMetrica
                titulo="TCH por Fazenda / Gleba"
                subtitulo="Toneladas de cana por hectare"
                dados={[...porFazenda].sort((a: any, b: any) => b.tch - a.tch)}
                campo="tch"
                formatar={(v: number) => fmt(v)}
                cor="azul"
                formato="colunas-media"
                referencia={tch}
              />

              <GraficoMetrica
                titulo="ATR por Fazenda / Gleba"
                subtitulo="ATR médio ponderado por toneladas"
                dados={[...porFazenda].sort((a: any, b: any) => b.atr - a.atr)}
                campo="atr"
                formatar={(v: number) => fmt(v, 4)}
                cor="dourado"
                formato="lollipop"
                referencia={atr}
              />

              <GraficoMetrica
                titulo="TAH por Fazenda / Gleba"
                subtitulo="ATR × TCH / 1000"
                dados={[...porFazenda]
                  .map((x: any) => ({ ...x, tah: (x.tch * x.atr) / 1000 }))
                  .sort((a: any, b: any) => b.tah - a.tah)}
                campo="tah"
                formatar={(v: number) => fmt(v)}
                cor="turquesa"
                formato="colunas"
              />
            </div>

            <section className="painel mensal-pendente">
              <div className="titulo">
                <div>
                  <span>EVOLUÇÃO DA SAFRA</span>
                  <h2>Produção mensal</h2>
                  <p>
                    Espaço reservado para os valores mensais consolidados que
                    serão informados.
                  </p>
                </div>
              </div>
              <div className="mensal-aviso">
                <strong>Dados mensais aguardando conferência</strong>
                <span>
                  O gráfico mensal não usa os valores automáticos atuais.
                </span>
              </div>
            </section>

            <section className="painel">
              <div className="titulo">
                <div>
                  <span>CONSOLIDADO</span>
                  <h2>Resultados por fazenda / gleba</h2>
                  <p>
                    Área, produção, TCH, ATR e TAH calculados com os registros
                    atuais.
                  </p>
                </div>
              </div>

              <div className="tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>CÓDIGO</th>
                      <th>FAZENDA / GLEBA</th>
                      <th>ÁREA COLHIDA</th>
                      <th>PRODUÇÃO</th>
                      <th>TCH</th>
                      <th>ATR</th>
                      <th>TAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porFazenda.map((x: any) => (
                      <tr key={`${x.codigo}-${x.nome}`}>
                        <td>
                          <strong>{x.codigo}</strong>
                        </td>
                        <td>{x.nome}</td>
                        <td>{fmt(x.area)} ha</td>
                        <td>{fmt(x.toneladas)} t</td>
                        <td>{fmt(x.tch)}</td>
                        <td>{fmt(x.atr, 4)}</td>
                        <td>{fmt((x.tch * x.atr) / 1000)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function MapaFazenda({
  fazenda,
  areas,
  producao,
  areaColhida,
  tch,
  atr,
  tah,
  fmt,
}: any) {
  const geometrias = areas
    .map((a: Registro) => {
      try {
        const geo =
          typeof a.geometria_geojson === 'string'
            ? JSON.parse(a.geometria_geojson)
            : a.geometria_geojson;
        return { ...a, geo };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const pontos: number[][] = [];
  const coletar = (coords: any) => {
    if (!Array.isArray(coords)) return;
    if (
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      pontos.push([coords[0], coords[1]]);
      return;
    }
    coords.forEach(coletar);
  };
  geometrias.forEach((g: any) => coletar(g.geo?.coordinates));

  if (!pontos.length) {
    return (
      <section className="painel mapa-fazenda-card">
        <div className="titulo">
          <div>
            <span>MAPA DA PROPRIEDADE</span>
            <h2>
              {fazenda.codigo} • {fazenda.nome}
            </h2>
            <p>
              A fazenda está selecionada, mas ainda não há geometria disponível
              para exibição.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const xs = pontos.map((p) => p[0]);
  const ys = pontos.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = Math.max(maxX - minX, 0.000001);
  const dy = Math.max(maxY - minY, 0.000001);
  const W = 900;
  const H = 470;
  const pad = 34;
  const escala = Math.min((W - pad * 2) / dx, (H - pad * 2) / dy);
  const largura = dx * escala;
  const altura = dy * escala;
  const offX = (W - largura) / 2;
  const offY = (H - altura) / 2;

  const projetarAnel = (anel: any[]) =>
    anel
      .map((p: any) => {
        const x = offX + (p[0] - minX) * escala;
        const y = H - (offY + (p[1] - minY) * escala);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const poligonos: any[] = [];
  geometrias.forEach((g: any, gi: number) => {
    if (g.geo?.type === 'Polygon') {
      if (g.geo.coordinates?.[0]) {
        poligonos.push({
          key: `${gi}-0`,
          pontos: projetarAnel(g.geo.coordinates[0]),
          area: g,
        });
      }
    } else if (g.geo?.type === 'MultiPolygon') {
      g.geo.coordinates?.forEach((p: any, pi: number) => {
        if (p?.[0])
          poligonos.push({
            key: `${gi}-${pi}`,
            pontos: projetarAnel(p[0]),
            area: g,
          });
      });
    }
  });

  const areaKml = areas.reduce((s: number, a: Registro) => {
    const n = Number(a.area_ha ?? 0);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <section className="painel mapa-fazenda-card">
      <div className="titulo mapa-fazenda-titulo">
        <div>
          <span>MAPA DA PROPRIEDADE • KML / GEOJSON</span>
          <h2>
            {fazenda.codigo} • {fazenda.nome}
          </h2>
          <p>{areas.length} polígono(s) carregado(s) do mapa da propriedade.</p>
        </div>
        <div className="mapa-status">● MAPA VINCULADO</div>
      </div>

      <div className="mapa-fazenda-grid">
        <div className="mapa-canvas">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Mapa da ${fazenda.nome}`}
          >
            <defs>
              <linearGradient id="mapaVerde" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#4aa66d" />
                <stop offset="100%" stopColor="#176044" />
              </linearGradient>
            </defs>
            {poligonos.map((p: any) => (
              <polygon
                key={p.key}
                points={p.pontos}
                fill="url(#mapaVerde)"
                fillOpacity="0.78"
                stroke="#ffffff"
                strokeWidth="2.2"
              >
                <title>
                  {`Talhão ${p.area.talhao_kml ?? '—'} • ${Number(
                    p.area.area_ha ?? 0
                  ).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ha`}
                </title>
              </polygon>
            ))}
          </svg>
          <div className="mapa-legenda">
            <span>
              <i /> Área mapeada
            </span>
            <strong>{fmt(areaKml, 3)} ha no KML</strong>
          </div>
        </div>

        <div className="mapa-resumo">
          <div>
            <span>PRODUÇÃO</span>
            <strong>{fmt(producao)} t</strong>
          </div>
          <div>
            <span>ÁREA COLHIDA</span>
            <strong>{fmt(areaColhida)} ha</strong>
          </div>
          <div>
            <span>TCH</span>
            <strong>{fmt(tch)}</strong>
          </div>
          <div>
            <span>ATR</span>
            <strong>{fmt(atr, 4)}</strong>
          </div>
          <div>
            <span>TAH</span>
            <strong>{fmt(tah)}</strong>
          </div>
          <div>
            <span>ÁREA KML</span>
            <strong>{fmt(areaKml, 3)} ha</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function GraficoMetrica({
  titulo,
  subtitulo,
  dados,
  campo,
  formatar,
  cor = 'verde',
  formato = 'horizontal',
  referencia = 0,
}: any) {
  const lista = dados;
  const maximo = Math.max(...lista.map((x: any) => Number(x[campo] ?? 0)), 1);

  return (
    <section className={`painel metrica-card metrica-${cor}`}>
      <div className="titulo">
        <div>
          <span>INDICADOR</span>
          <h2>{titulo}</h2>
          <p>{subtitulo}</p>
        </div>
      </div>

      {formato === 'horizontal' ? (
        <div className="metrica-barras">
          {lista.map((x: any) => {
            const valor = Number(x[campo] ?? 0);
            return (
              <div
                className="metrica-item"
                key={`${campo}-${x.codigo}-${x.nome}`}
              >
                <div className="metrica-topo">
                  <strong>
                    {x.codigo} • {x.nome}
                  </strong>
                  <b>{formatar(valor)}</b>
                </div>
                <div className="metrica-trilho">
                  <div
                    style={{ width: `${Math.max((valor / maximo) * 100, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : formato === 'lollipop' ? (
        <div className="lollipop-lista">
          {lista.map((x: any) => {
            const valor = Number(x[campo] ?? 0);
            const pct = Math.max((valor / maximo) * 100, 2);
            return (
              <div
                className="lollipop-item"
                key={`${campo}-${x.codigo}-${x.nome}`}
              >
                <div className="lollipop-topo">
                  <strong>
                    {x.codigo} •{' '}
                    {String(x.nome ?? '').replace(/^Fazenda\s+/i, '')}
                  </strong>
                  <b>{formatar(valor)}</b>
                </div>
                <div className="lollipop-linha">
                  <div style={{ width: `${pct}%` }} />
                  <i style={{ left: `calc(${pct}% - 7px)` }} />
                </div>
              </div>
            );
          })}
          {referencia > 0 && (
            <div className="referencia-texto">
              Média geral: {formatar(referencia)}
            </div>
          )}
        </div>
      ) : (
        <div className="metrica-colunas-wrap">
          <div className="metrica-colunas">
            {lista.map((x: any) => {
              const valor = Number(x[campo] ?? 0);
              return (
                <div
                  className="coluna-item"
                  key={`${campo}-${x.codigo}-${x.nome}`}
                >
                  <b>{formatar(valor)}</b>
                  <div className="coluna-trilho">
                    <div
                      style={{
                        height: `${Math.max((valor / maximo) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <strong>{x.codigo}</strong>
                  <small>
                    {String(x.nome ?? '').replace(/^Fazenda\s+/i, '')}
                  </small>
                </div>
              );
            })}
          </div>
          {formato === 'colunas-media' && referencia > 0 && (
            <div className="media-badge">
              Média geral: {formatar(referencia)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MonitoramentoPragas() {
  const [novaProgramacaoBroca, setNovaProgramacaoBroca] = useState(false);
  const [apontamentoBroca, setApontamentoBroca] = useState<Registro | null>(null);
  const [salvandoApontamentoBroca, setSalvandoApontamentoBroca] = useState(false);
  const [erroApontamentoBroca, setErroApontamentoBroca] = useState('');
  const [arquivosBroca, setArquivosBroca] = useState<File[]>([]);
  const [evidenciasBrocaExistentes, setEvidenciasBrocaExistentes] = useState<Registro[]>([]);
  const [carregandoEvidenciasBroca, setCarregandoEvidenciasBroca] = useState(false);
  const [sucessoApontamentoBroca, setSucessoApontamentoBroca] = useState('');
  const [formApontamentoBroca, setFormApontamentoBroca] = useState({
    data_execucao_soltura: '2026-09-25',
    quantidade_armadilhas_instaladas: '',
    status_soltura: 'Executado',
    justificativa_soltura: '',
    responsavel_soltura: '',
  });
  const [salvandoProgramacaoBroca, setSalvandoProgramacaoBroca] =
    useState(false);
  const [erroProgramacaoBroca, setErroProgramacaoBroca] = useState('');
  const [sucessoProgramacaoBroca, setSucessoProgramacaoBroca] = useState('');
  const [fazendasProgramacaoBroca, setFazendasProgramacaoBroca] = useState<
    Registro[]
  >([]);
  const [formBroca, setFormBroca] = useState({
    cliente_id: '',
    fazenda_id: '',
    talhoes: '',
    corte: '',
    area_ha: '',
    data_soltura: '',
    metodo: '1 armadilha a cada 30 hectares',
    observacoes: '',
  });

  function somarDiasData(data: string, dias: number) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function abrirNovaProgramacaoBroca() {
    setErroProgramacaoBroca('');
    setSucessoProgramacaoBroca('');
    setFormBroca({
      cliente_id: '',
      fazenda_id: '',
      talhoes: '',
      corte: '',
      area_ha: '',
      data_soltura: '',
      metodo: '1 armadilha a cada 30 hectares',
      observacoes: '',
    });
    setNovaProgramacaoBroca(true);
  }

  async function carregarFazendasProgramacaoBroca(clienteId: string) {
    setFazendasProgramacaoBroca([]);
    if (!clienteId) return;
    const { data, error } = await supabase
      .from('fazendas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('codigo');
    if (error) {
      setErroProgramacaoBroca(error.message);
      return;
    }
    setFazendasProgramacaoBroca(data ?? []);
  }

  async function salvarNovaProgramacaoBroca(event: React.FormEvent) {
    event.preventDefault();
    setErroProgramacaoBroca('');
    setSucessoProgramacaoBroca('');

    const fazenda = fazendasProgramacaoBroca.find(
      (f) => f.id === formBroca.fazenda_id
    );
    const area = Number(String(formBroca.area_ha).replace(',', '.'));

    if (!formBroca.cliente_id) {
      setErroProgramacaoBroca('Selecione o cliente.');
      return;
    }
    if (!fazenda) {
      setErroProgramacaoBroca('Selecione a fazenda.');
      return;
    }
    if (!formBroca.talhoes.trim()) {
      setErroProgramacaoBroca('Informe o(s) talhão(ões).');
      return;
    }
    if (!Number.isFinite(area) || area <= 0) {
      setErroProgramacaoBroca('Informe uma área válida.');
      return;
    }
    if (!formBroca.data_soltura) {
      setErroProgramacaoBroca('Informe a data de soltura.');
      return;
    }

    const dataPrevista = somarDiasData(formBroca.data_soltura, 3);
    const armadilhasEquivalentes = Math.ceil(area / 30);

    setSalvandoProgramacaoBroca(true);

    const { error } = await supabase.from('broca_monitoramentos').insert({
      cliente_id: formBroca.cliente_id,
      fazenda_id: fazenda.id,
      talhao_id: null,
      safra: safraSelecionada,
      codigo: String(fazenda.codigo || ''),
      codigo_fazenda: String(fazenda.codigo || ''),
      data_soltura: formBroca.data_soltura,
      data_prevista_recolhimento: dataPrevista,
      data_levantamento: null,
      talhoes: formBroca.talhoes.trim(),
      corte: formBroca.corte.trim() || null,
      area_ha: area,
      metodo: formBroca.metodo,
      quantidade_armadilhas: armadilhasEquivalentes,
      justificativa: null,
      justificativa_recolhimento: null,
      mariposas: null,
      indice: null,
      situacao: 'Aguardando recolhimento',
      observacoes: formBroca.observacoes.trim() || null,
      ativo: true,
    });

    if (error) {
      setErroProgramacaoBroca(error.message);
      setSalvandoProgramacaoBroca(false);
      return;
    }

    setSucessoProgramacaoBroca(
      `Programação salva. Recolhimento previsto para ${dataPrevista
        .split('-')
        .reverse()
        .join('/')}.`
    );
    setSalvandoProgramacaoBroca(false);
    await carregar();
    setTimeout(() => setNovaProgramacaoBroca(false), 900);
  }

  async function carregarEvidenciasDoApontamentoBroca(monitoramentoId: string) {
    setCarregandoEvidenciasBroca(true);
    const { data, error } = await supabase
      .from('broca_evidencias')
      .select('*')
      .eq('monitoramento_id', monitoramentoId)
      .order('criado_em', { ascending: true });

    if (error) {
      setErroApontamentoBroca(`Falha ao carregar evidências: ${error.message}`);
      setEvidenciasBrocaExistentes([]);
      setCarregandoEvidenciasBroca(false);
      return;
    }

    const comUrls = await Promise.all((data ?? []).map(async (e: Registro) => {
      const { data: signed } = await supabase.storage
        .from('broca-evidencias')
        .createSignedUrl(String(e.storage_path), 3600);
      return { ...e, url_temporaria: signed?.signedUrl || '' };
    }));
    setEvidenciasBrocaExistentes(comUrls);
    setCarregandoEvidenciasBroca(false);
  }

  async function abrirApontamentoBroca(registro: Registro) {
    const programadas = Math.ceil(Number(registro.quantidade_armadilhas || 0));
    const codigo = String(registro.codigo_fazenda || registro.codigo || '').trim();
    const jaApontado = Boolean(registro.data_execucao_soltura || registro.status_soltura);
    const naoExecutadaHoje = !jaApontado && ['352', '940', '1212'].includes(codigo);
    setErroApontamentoBroca('');
    setSucessoApontamentoBroca('');
    setArquivosBroca([]);
    setEvidenciasBrocaExistentes([]);
    setFormApontamentoBroca({
      data_execucao_soltura: registro.data_execucao_soltura || '2026-09-25',
      quantidade_armadilhas_instaladas: jaApontado
        ? String(registro.quantidade_armadilhas_instaladas ?? '')
        : naoExecutadaHoje
        ? '0'
        : String(programadas),
      status_soltura: jaApontado
        ? String(registro.status_soltura || 'Executado')
        : naoExecutadaHoje
        ? 'Não executado'
        : 'Executado',
      justificativa_soltura: jaApontado
        ? String(registro.justificativa_soltura || '')
        : naoExecutadaHoje
        ? 'Falta de armadilhas'
        : '',
      responsavel_soltura: String(registro.responsavel_soltura || ''),
    });
    setApontamentoBroca(registro);
    await carregarEvidenciasDoApontamentoBroca(String(registro.id));
  }

  async function salvarApontamentoBroca(event: React.FormEvent) {
    event.preventDefault();
    if (!apontamentoBroca) return;
    setErroApontamentoBroca('');
    setSucessoApontamentoBroca('');

    const programadas = Math.ceil(Number(apontamentoBroca.quantidade_armadilhas || 0));
    const instaladas = Number(formApontamentoBroca.quantidade_armadilhas_instaladas);
    if (!Number.isInteger(instaladas) || instaladas < 0) {
      setErroApontamentoBroca('Informe a quantidade inteira de armadilhas realmente instaladas.');
      return;
    }
    const status = instaladas === 0 ? 'Não executado' : instaladas < programadas ? 'Parcial' : 'Executado';
    if (instaladas < programadas && !formApontamentoBroca.justificativa_soltura.trim()) {
      setErroApontamentoBroca('A justificativa é obrigatória quando a execução for menor que a programação.');
      return;
    }
    if (!formApontamentoBroca.data_execucao_soltura) {
      setErroApontamentoBroca('Informe a data da execução.');
      return;
    }
    if (status !== 'Não executado' && !formApontamentoBroca.responsavel_soltura.trim()) {
      setErroApontamentoBroca('Informe o responsável pela soltura.');
      return;
    }

    setSalvandoApontamentoBroca(true);
    const { error: updateError } = await supabase
      .from('broca_monitoramentos')
      .update({
        quantidade_armadilhas_instaladas: instaladas,
        status_soltura: status,
        justificativa_soltura: formApontamentoBroca.justificativa_soltura.trim() || null,
        data_execucao_soltura: formApontamentoBroca.data_execucao_soltura,
        responsavel_soltura: formApontamentoBroca.responsavel_soltura.trim() || null,
        situacao: status === 'Não executado' ? 'Soltura não executada' : 'Aguardando recolhimento',
      })
      .eq('id', apontamentoBroca.id);

    if (updateError) {
      setErroApontamentoBroca(updateError.message);
      setSalvandoApontamentoBroca(false);
      return;
    }

    for (const arquivo of arquivosBroca) {
      const ehVideo = arquivo.type.startsWith('video/');
      const nomeSeguro = arquivo.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${apontamentoBroca.cliente_id}/${apontamentoBroca.id}/soltura/${crypto.randomUUID()}-${nomeSeguro}`;
      const { error: uploadError } = await supabase.storage.from('broca-evidencias').upload(storagePath, arquivo, { upsert: false });
      if (uploadError) {
        setErroApontamentoBroca(`Apontamento salvo, mas falhou o envio de ${arquivo.name}: ${uploadError.message}`);
        setSalvandoApontamentoBroca(false);
        await carregar();
        return;
      }
      const { error: evidenciaError } = await supabase.from('broca_evidencias').insert({
        monitoramento_id: apontamentoBroca.id,
        tipo: ehVideo ? 'Video' : 'Foto',
        etapa: 'Soltura',
        storage_path: storagePath,
        nome_arquivo: arquivo.name,
        mime_type: arquivo.type || null,
        tamanho_bytes: arquivo.size,
      });
      if (evidenciaError) {
        await supabase.storage.from('broca-evidencias').remove([storagePath]);
        setErroApontamentoBroca(`Apontamento salvo, mas falhou o registro de ${arquivo.name}: ${evidenciaError.message}`);
        setSalvandoApontamentoBroca(false);
        await carregar();
        return;
      }
    }

    const { data: evidenciasConfirmadas, error: confirmacaoError } = await supabase
      .from('broca_evidencias')
      .select('id, nome_arquivo')
      .eq('monitoramento_id', apontamentoBroca.id);

    if (confirmacaoError) {
      setErroApontamentoBroca(`Apontamento salvo, mas não foi possível confirmar as evidências: ${confirmacaoError.message}`);
      setSalvandoApontamentoBroca(false);
      return;
    }

    if (arquivosBroca.length > 0) {
      const nomesConfirmados = new Set((evidenciasConfirmadas ?? []).map((e: Registro) => String(e.nome_arquivo || '')));
      const faltantes = arquivosBroca.filter((a) => !nomesConfirmados.has(a.name));
      if (faltantes.length > 0) {
        setErroApontamentoBroca(`O apontamento foi salvo, mas ${faltantes.length} evidência(s) não foram confirmadas no banco. Tente enviar novamente.`);
        setSalvandoApontamentoBroca(false);
        await carregarEvidenciasDoApontamentoBroca(String(apontamentoBroca.id));
        return;
      }
    }

    setArquivosBroca([]);
    await carregarEvidenciasDoApontamentoBroca(String(apontamentoBroca.id));
    await carregar();
    setSalvandoApontamentoBroca(false);
    setSucessoApontamentoBroca(
      arquivosBroca.length > 0
        ? `Apontamento salvo e ${arquivosBroca.length} evidência(s) confirmada(s) no banco.`
        : 'Apontamento atualizado com sucesso.'
    );
  }

  async function excluirProgramacaoBroca(registro: Registro) {
    if (registro.data_levantamento || registro.mariposas != null) {
      alert(
        'Este registro já possui levantamento/resultado e não pode ser excluído por aqui.'
      );
      return;
    }

    const fazenda = fazendas.find((f) => f.id === registro.fazenda_id);
    const identificacao = `${
      registro.codigo_fazenda || registro.codigo || '—'
    } • ${fazenda?.nome || 'Fazenda'}`;
    const detalhes = [
      `Fazenda: ${identificacao}`,
      `Talhão(ões): ${registro.talhoes || '—'}`,
      `Área: ${n(registro.area_ha, 2)} ha`,
      `Soltura: ${dataBR(registro.data_soltura)}`,
    ].join('\n');

    if (
      !window.confirm(
        `Excluir esta programação de Broca?\n\n${detalhes}\n\nA fazenda e os talhões NÃO serão excluídos.`
      )
    )
      return;

    const { error } = await supabase
      .from('broca_monitoramentos')
      .update({
        ativo: false,
        situacao: 'Cancelada',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', registro.id);

    if (error) {
      alert(`Não foi possível excluir a programação: ${error.message}`);
      return;
    }

    await carregar();
  }

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [safraSelecionada, setSafraSelecionada] = useState('2026/2027');
  const [broca, setBroca] = useState<Registro[]>([]);
  const [sphenophorus, setSphenophorus] = useState<Registro[]>([]);
  const [sphenophorusFazendas, setSphenophorusFazendas] = useState<Registro[]>(
    []
  );
  const [brocaFazendas, setBrocaFazendas] = useState<Registro[]>([]);
  const [fazendas, setFazendas] = useState<Registro[]>([]);
  const [clientesPragas, setClientesPragas] = useState<Registro[]>([]);
  const [brocaHistoricoFazenda, setBrocaHistoricoFazenda] = useState<
    Registro[]
  >([]);
  const [sphHistoricoFazenda, setSphHistoricoFazenda] = useState<Registro[]>(
    []
  );
  const [pragaRelatorio, setPragaRelatorio] = useState<
    'broca' | 'sphenophorus'
  >('broca');
  const [fazendaRelatorio, setFazendaRelatorio] = useState('todas');
  const [anoInicialRelatorio, setAnoInicialRelatorio] = useState(2021);
  const [anoFinalRelatorio, setAnoFinalRelatorio] = useState(2026);
  const [relatorioColorido, setRelatorioColorido] = useState(true);
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(true);
  const [relatoriosCompartilhados, setRelatoriosCompartilhados] = useState<Registro[]>([]);
  const [gerandoRelatorioCompartilhado, setGerandoRelatorioCompartilhado] = useState(false);

  async function carregarRelatoriosCompartilhados() {
    const { data, error } = await supabase
      .from('relatorios_compartilhados')
      .select('*')
      .eq('tipo_relatorio', 'broca_soltura')
      .order('criado_em', { ascending: false });
    if (!error) setRelatoriosCompartilhados(data ?? []);
  }


  async function carregar() {
    setCarregando(true);
    setErro('');

    const [b, s, sf, bf, f, c, bhf, shf] = await Promise.all([
      supabase
        .from('broca_consolidados')
        .select('*')
        .order('ano', { ascending: true }),
      supabase
        .from('sphenophorus_consolidados')
        .select('*')
        .order('ano', { ascending: true }),
      supabase
        .from('monitoramento_pragas')
        .select('*')
        .ilike('praga', '%sphenophorus%')
        .order('percentual_infestacao', { ascending: false }),
      supabase
        .from('broca_monitoramentos')
        .select('*')
        .order('indice', { ascending: false }),
      supabase.from('fazendas').select('id,nome,codigo,cliente_id'),
      supabase.from('clientes').select('id,nome,logo_url'),
      supabase
        .from('broca_fazenda_historico')
        .select('*')
        .eq('ativo', true)
        .order('ano', { ascending: true }),
      supabase
        .from('sphenophorus_fazenda_historico')
        .select('*')
        .eq('ativo', true)
        .order('ano', { ascending: true }),
    ]);

    const falha =
      b.error ||
      s.error ||
      sf.error ||
      bf.error ||
      f.error ||
      c.error ||
      bhf.error ||
      shf.error;
    if (falha) setErro(falha.message);
    else {
      setBroca(b.data ?? []);
      setSphenophorus(s.data ?? []);
      setSphenophorusFazendas(sf.data ?? []);
      setBrocaFazendas(bf.data ?? []);
      setFazendas(f.data ?? []);
      setClientesPragas(c.data ?? []);
      setBrocaHistoricoFazenda(bhf.data ?? []);
      setSphHistoricoFazenda(shf.data ?? []);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    carregarRelatoriosCompartilhados();
  }, []);

  const anoSafra = Number(safraSelecionada.split('/')[0]);
  const brocaAtual = broca.find((x) => x.safra === safraSelecionada);
  const sphAtual =
    sphenophorus.find((x) => x.safra === safraSelecionada) ||
    sphenophorus.find((x) => Number(x.ano) === anoSafra);
  const brocaAnterior = broca.find((x) => Number(x.ano) === anoSafra - 1);
  const sphAnterior = sphenophorus.find((x) => Number(x.ano) === anoSafra - 1);
  const brocaFazendasSafra = brocaFazendas.filter(
    (x) => x.safra === safraSelecionada && x.ativo !== false
  );
  const sphFazendasSafra = sphenophorusFazendas.filter(
    (x) => x.safra === safraSelecionada
  );

  const variacaoBroca =
    brocaAtual && brocaAnterior
      ? Number(brocaAtual.indice_medio) - Number(brocaAnterior.indice_medio)
      : null;

  const variacaoSph =
    sphAtual && sphAnterior
      ? Number(sphAtual.percentual_medio) - Number(sphAnterior.percentual_medio)
      : null;

  const possuiDados = Boolean(
    brocaAtual ||
      sphAtual ||
      brocaFazendasSafra.length ||
      sphFazendasSafra.length
  );

  const nomeFazenda = (id: any) => {
    const f = fazendas.find((x) => x.id === id);
    return f ? `${f.nome}${f.codigo ? ` • ${f.codigo}` : ''}` : 'Fazenda';
  };

  const n = (v: any, casas = 0) =>
    Number(v ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });

  const historicoBroca = [...broca]
    .filter((x) => Number(x.ano) >= 2021 && Number(x.ano) <= 2026)
    .sort((a, b) => Number(a.ano) - Number(b.ano));

  const anosSph = [2022, 2023, 2024, 2025, 2026];
  const historicoSph = anosSph.map((ano) => ({
    ano,
    registro: sphenophorus.find((x) => Number(x.ano) === ano) || null,
  }));

  const maxBroca = Math.max(
    ...historicoBroca.map((x) => Number(x.indice_medio || 0)),
    0.01
  );
  const maxSph = Math.max(
    ...historicoSph.map((x) => Number(x.registro?.percentual_medio || 0)),
    0.01
  );

  const rankingBroca = [...brocaFazendasSafra].sort(
    (a, b) => Number(b.indice || 0) - Number(a.indice || 0)
  );
  const rankingSph = [...sphFazendasSafra].sort(
    (a, b) =>
      Number(b.percentual_infestacao || 0) -
      Number(a.percentual_infestacao || 0)
  );

  const leituraBroca =
    variacaoBroca === null
      ? 'Sem base anterior disponível para comparação.'
      : variacaoBroca < 0
      ? `Índice ${n(Math.abs(variacaoBroca), 2)} p.p. abaixo do ano anterior.`
      : variacaoBroca > 0
      ? `Índice ${n(variacaoBroca, 2)} p.p. acima do ano anterior.`
      : 'Índice estável em relação ao ano anterior.';

  const leituraSph =
    variacaoSph === null
      ? 'Sem base anterior disponível para comparação.'
      : variacaoSph < 0
      ? `Infestação ${n(Math.abs(variacaoSph), 2)} p.p. abaixo do ano anterior.`
      : variacaoSph > 0
      ? `Infestação ${n(variacaoSph, 2)} p.p. acima do ano anterior.`
      : 'Infestação estável em relação ao ano anterior.';

  const baseRelatorio =
    pragaRelatorio === 'broca' ? brocaHistoricoFazenda : sphHistoricoFazenda;
  const campoIndiceRelatorio =
    pragaRelatorio === 'broca' ? 'indice_medio' : 'percentual_medio';
  const historicoRelatorioFiltrado = baseRelatorio
    .filter(
      (x) => fazendaRelatorio === 'todas' || x.fazenda_id === fazendaRelatorio
    )
    .filter(
      (x) =>
        Number(x.ano) >= anoInicialRelatorio &&
        Number(x.ano) <= anoFinalRelatorio
    )
    .sort((a, b) => Number(a.ano) - Number(b.ano));

  const anosRelatorio = Array.from(
    { length: Math.max(anoFinalRelatorio - anoInicialRelatorio + 1, 0) },
    (_, i) => anoInicialRelatorio + i
  );

  const serieRelatorio = anosRelatorio.map((ano) => {
    // Quando o relatório estiver em "Todas as fazendas", usamos o consolidado
    // oficial da praga. Isso evita calcular média simples dos percentuais das
    // propriedades, que distorce o resultado geral.
    if (fazendaRelatorio === 'todas') {
      const consolidado =
        pragaRelatorio === 'broca'
          ? broca.find((x) => Number(x.ano) === ano)
          : sphenophorus.find((x) => Number(x.ano) === ano);

      if (!consolidado) {
        return { ano, valor: null as number | null, registros: 0 };
      }

      const valor =
        pragaRelatorio === 'broca'
          ? Number(consolidado.indice_medio)
          : Number(consolidado.percentual_medio);

      return {
        ano,
        valor: Number.isFinite(valor) ? valor : null,
        registros: 1,
      };
    }

    // Quando uma propriedade específica estiver selecionada, usamos o
    // histórico real daquela propriedade. Ano sem levantamento permanece
    // como "Sem levantamento", nunca como zero.
    const registrosAno = historicoRelatorioFiltrado.filter(
      (x) => Number(x.ano) === ano
    );

    if (!registrosAno.length) {
      return { ano, valor: null as number | null, registros: 0 };
    }

    const registro = registrosAno[0];
    const valor = Number(registro[campoIndiceRelatorio]);

    return {
      ano,
      valor: Number.isFinite(valor) ? valor : null,
      registros: registrosAno.length,
    };
  });

  const pontosComDados = serieRelatorio.filter((x) => x.valor !== null);
  const primeiroRelatorio = pontosComDados[0] ?? null;
  const ultimoRelatorio = pontosComDados[pontosComDados.length - 1] ?? null;
  const variacaoRelatorio =
    primeiroRelatorio &&
    ultimoRelatorio &&
    primeiroRelatorio.ano !== ultimoRelatorio.ano
      ? Number(ultimoRelatorio.valor) - Number(primeiroRelatorio.valor)
      : null;
  const valoresRelatorio = pontosComDados.map((x) => Number(x.valor));
  const maxRelatorio = Math.max(...valoresRelatorio, 0.01);
  const menorRelatorio = valoresRelatorio.length
    ? Math.min(...valoresRelatorio)
    : null;
  const maiorRelatorio = valoresRelatorio.length
    ? Math.max(...valoresRelatorio)
    : null;

  const fazendasComHistorico = fazendas
    .filter((f) => baseRelatorio.some((h) => h.fazenda_id === f.id))
    .sort((a, b) =>
      `${a.nome} ${a.codigo ?? ''}`.localeCompare(
        `${b.nome} ${b.codigo ?? ''}`,
        'pt-BR'
      )
    );

  const fazendaSelecionadaRelatorio =
    fazendaRelatorio === 'todas'
      ? null
      : fazendas.find((f) => f.id === fazendaRelatorio) ?? null;

  const clientesHistoricoIds = Array.from(
    new Set(fazendasComHistorico.map((f) => f.cliente_id).filter(Boolean))
  );

  const clienteRelatorio = fazendaSelecionadaRelatorio?.cliente_id
    ? clientesPragas.find(
        (c) => c.id === fazendaSelecionadaRelatorio.cliente_id
      ) ?? null
    : clientesHistoricoIds.length === 1
    ? clientesPragas.find((c) => c.id === clientesHistoricoIds[0]) ?? null
    : null;

  // DASHBOARD AVANÇADO — visão executiva da safra selecionada
  const topBroca = rankingBroca.slice(0, 5);
  const topSph = rankingSph.slice(0, 5);
  const maxRankingBroca = Math.max(
    ...topBroca.map((x) => Number(x.indice || 0)),
    0.01
  );
  const maxRankingSph = Math.max(
    ...topSph.map((x) => Number(x.percentual_infestacao || 0)),
    0.01
  );

  const totalFazendasMonitoradas = new Set(
    [
      ...brocaFazendasSafra.map((x) => x.fazenda_id),
      ...sphFazendasSafra.map((x) => x.fazenda_id),
    ].filter(Boolean)
  ).size;

  const tendenciaBroca =
    variacaoBroca === null
      ? 'Sem comparação'
      : variacaoBroca < 0
      ? 'Redução'
      : variacaoBroca > 0
      ? 'Aumento'
      : 'Estável';

  const tendenciaSph =
    variacaoSph === null
      ? 'Sem comparação'
      : variacaoSph < 0
      ? 'Redução'
      : variacaoSph > 0
      ? 'Aumento'
      : 'Estável';

  function usarTodoHistorico() {
    const anos = baseRelatorio
      .filter(
        (x) => fazendaRelatorio === 'todas' || x.fazenda_id === fazendaRelatorio
      )
      .map((x) => Number(x.ano))
      .filter(Number.isFinite);
    if (!anos.length) return;
    setAnoInicialRelatorio(Math.min(...anos));
    setAnoFinalRelatorio(Math.max(...anos));
  }

  async function gerarRelatorioPDF() {
    const relatorio = document.querySelector(
      '.relatorio-impressao'
    ) as HTMLElement | null;
    if (!relatorio) {
      alert('Não foi possível localizar o relatório para gerar o PDF.');
      return;
    }

    const botao = document.querySelector(
      '.botao-gerar-relatorio'
    ) as HTMLButtonElement | null;
    const textoOriginal = botao?.textContent || 'Baixar PDF colorido';

    let fontesOriginais: string[] = [];

    try {
      if (botao) {
        botao.disabled = true;
        botao.textContent = 'Gerando PDF...';
      }

      relatorio.classList.add('pdf-export');
      await new Promise((resolve) => setTimeout(resolve, 250));

      const imagens = Array.from(
        relatorio.querySelectorAll('img')
      ) as HTMLImageElement[];
      await Promise.all(
        imagens.map(
          (el) =>
            new Promise<void>((resolve) => {
              if (el.complete) return resolve();
              el.onload = () => resolve();
              el.onerror = () => resolve();
            })
        )
      );

      // O html2canvas pode ignorar imagens locais/public do Vite no download.
      // Antes da captura, convertemos cada imagem do relatório para data URL.
      fontesOriginais = imagens.map((img) => img.src);
      await Promise.all(
        imagens.map(async (img) => {
          if (!img.src || img.src.startsWith('data:')) return;
          try {
            const resposta = await fetch(img.src, { cache: 'no-store' });
            if (!resposta.ok) return;
            const blob = await resposta.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const leitor = new FileReader();
              leitor.onload = () => resolve(String(leitor.result));
              leitor.onerror = () => reject(leitor.error);
              leitor.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch (erro) {
            console.warn(
              'Não foi possível incorporar uma imagem ao PDF:',
              img.src,
              erro
            );
          }
        })
      );

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const canvas = await html2canvas(relatorio, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: relatorio.scrollWidth,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const larguraPagina = 210;
      const alturaPagina = 297;
      const margem = 8;
      const larguraUtil = larguraPagina - margem * 2;
      const alturaUtil = alturaPagina - margem * 2;
      const pxPorMm = canvas.width / larguraUtil;
      const alturaPaginaPx = Math.floor(alturaUtil * pxPorMm);

      let yOrigem = 0;
      let pagina = 0;

      while (yOrigem < canvas.height) {
        const alturaFatia = Math.min(alturaPaginaPx, canvas.height - yOrigem);
        const paginaCanvas = document.createElement('canvas');
        paginaCanvas.width = canvas.width;
        paginaCanvas.height = alturaFatia;

        const ctx = paginaCanvas.getContext('2d');
        if (!ctx) throw new Error('Não foi possível preparar a página do PDF.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, paginaCanvas.width, paginaCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          yOrigem,
          canvas.width,
          alturaFatia,
          0,
          0,
          canvas.width,
          alturaFatia
        );

        const imagem = paginaCanvas.toDataURL('image/jpeg', 0.96);
        const alturaImagemMm = alturaFatia / pxPorMm;

        if (pagina > 0) pdf.addPage();
        pdf.addImage(
          imagem,
          'JPEG',
          margem,
          margem,
          larguraUtil,
          alturaImagemMm,
          undefined,
          'FAST'
        );

        yOrigem += alturaFatia;
        pagina += 1;
      }

      const pragaNome =
        pragaRelatorio === 'broca' ? 'broca-da-cana' : 'sphenophorus';
      const fazendaNome =
        fazendaRelatorio === 'todas'
          ? 'todas-as-fazendas'
          : (
              fazendasComHistorico.find((f) => f.id === fazendaRelatorio)
                ?.nome || 'fazenda'
            )
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-zA-Z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .toLowerCase();

      pdf.save(`relatorio-fitossanitario-${pragaNome}-${fazendaNome}.pdf`);
    } catch (erro) {
      console.error('Erro ao gerar PDF:', erro);
      alert(
        'Não foi possível gerar o PDF. Confira o console para mais detalhes.'
      );
    } finally {
      const imagensAtuais = Array.from(
        relatorio.querySelectorAll('img')
      ) as HTMLImageElement[];
      if (typeof fontesOriginais !== 'undefined') {
        imagensAtuais.forEach((img, indice) => {
          if (fontesOriginais[indice]) img.src = fontesOriginais[indice];
        });
      }
      relatorio.classList.remove('pdf-export');
      if (botao) {
        botao.disabled = false;
        botao.textContent = textoOriginal;
      }
    }
  }

  function imprimirRelatorio() {
    window.print();
  }

  useEffect(() => {
    if (novaProgramacaoBroca && formBroca.cliente_id) {
      carregarFazendasProgramacaoBroca(formBroca.cliente_id);
    }
  }, [novaProgramacaoBroca]);

  const brocaOperacional = [...brocaFazendasSafra]
    .filter(
      (x) =>
        x.data_soltura || x.data_prevista_recolhimento || x.data_levantamento
    )
    .sort((a, b) =>
      String(b.data_soltura || b.data_levantamento || '').localeCompare(
        String(a.data_soltura || a.data_levantamento || '')
      )
    );

  const brocaConcluidos = brocaOperacional.filter(
    (x) => x.data_levantamento && x.mariposas != null
  );
  const brocaARecolher = brocaOperacional.filter(
    (x) => x.data_soltura && !x.data_levantamento
  );
  const brocaSolturaPendente = brocaOperacional.filter(
    (x) => x.data_soltura && !x.data_levantamento && !x.status_soltura
  );
  const brocaNaoExecutados = brocaOperacional.filter(
    (x) => x.data_soltura && !x.data_levantamento && x.status_soltura === 'Não executado'
  );

  const dataBR = (valor: any) => {
    if (!valor) return '—';
    const partes = String(valor).slice(0, 10).split('-');
    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : String(valor);
  };

  const somaBroca = (campo: string, lista = brocaConcluidos) =>
    lista.reduce((soma, x) => soma + Number(x?.[campo] || 0), 0);

  const dataProgramacaoPDF =
    brocaARecolher
      .map((x) => String(x.data_soltura || '').slice(0, 10))
      .filter(Boolean)
      .sort()
      .at(-1) || '';

  const programacaoBrocaPDF = brocaARecolher
    .filter(
      (x) => String(x.data_soltura || '').slice(0, 10) === dataProgramacaoPDF
    )
    .sort((a, b) => {
      const ca = String(a.codigo_fazenda || a.codigo || '');
      const cb = String(b.codigo_fazenda || b.codigo || '');
      return ca.localeCompare(cb, 'pt-BR', { numeric: true });
    });

  const clienteProgramacaoPDF = (() => {
    const ids = Array.from(
      new Set(programacaoBrocaPDF.map((x) => x.cliente_id).filter(Boolean))
    );
    return ids.length === 1
      ? clientesPragas.find((c) => c.id === ids[0]) ?? null
      : null;
  })();

  function slugRelatorio(valor: any) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cliente';
  }

  function linkPublicoRelatorio(relatorioOuToken: Registro | string, nomeCliente?: string) {
    const token = typeof relatorioOuToken === 'string' ? relatorioOuToken : relatorioOuToken.token;
    const clienteNome = nomeCliente || (typeof relatorioOuToken === 'string' ? 'cliente' : clientesPragas.find((c) => c.id === relatorioOuToken.cliente_id)?.nome || 'cliente');
    return `${window.location.origin}/relatorio/souza-silva/${slugRelatorio(clienteNome)}/broca-soltura/${token}`;
  }

  async function copiarLinkRelatorio(relatorio: Registro) {
    const cliente = clientesPragas.find((c) => c.id === relatorio.cliente_id);
    const nomeCliente = cliente?.nome || 'Cliente';
    const link = linkPublicoRelatorio(relatorio, nomeCliente);
    const mensagem = `SOUZA SILVA\nGestão, Tecnologia e Consultoria Agrícola\n\nRelatório de Monitoramento de Broca-da-Cana • Soltura\nCliente: ${nomeCliente}\nSafra: ${relatorio.safra || '—'}\n\nAcesse o relatório pelo link abaixo:\n${link}`;
    try {
      await navigator.clipboard.writeText(mensagem);
      alert('Mensagem e link do relatório copiados.');
    } catch {
      window.prompt('Copie a mensagem do relatório:', mensagem);
    }
  }

  async function revogarRelatorio(relatorio: Registro) {
    if (!window.confirm(`Revogar o link de “${relatorio.titulo}”?`)) return;
    const { error } = await supabase.from('relatorios_compartilhados').update({ status: 'revogado' }).eq('id', relatorio.id);
    if (error) { alert(error.message); return; }
    await carregarRelatoriosCompartilhados();
  }

  async function gerarRelatoriosSoltura() {
    const dataBase = brocaOperacional
      .map((x) => String(x.data_execucao_soltura || x.data_soltura || '').slice(0, 10))
      .filter(Boolean).sort().at(-1) || '';
    const itensBase = brocaOperacional.filter((x) =>
      String(x.data_execucao_soltura || x.data_soltura || '').slice(0, 10) === dataBase && Boolean(x.status_soltura)
    );
    if (!itensBase.length) {
      alert('Não há apontamentos de soltura para gerar o relatório.');
      return;
    }
    const grupos = new Map<string, Registro[]>();
    itensBase.forEach((x) => {
      const k = String(x.cliente_id || '');
      if (!k) return;
      grupos.set(k, [...(grupos.get(k) || []), x]);
    });
    if (!grupos.size) { alert('Os apontamentos não possuem cliente vinculado.'); return; }
    setGerandoRelatorioCompartilhado(true);
    try {
      const links: string[] = [];
      for (const [clienteId, itens] of grupos.entries()) {
        const cliente = clientesPragas.find((c) => c.id === clienteId);
        const titulo = `Broca • Soltura • ${cliente?.nome || 'Cliente'} • ${dataBR(dataBase)}`;
        const { data: rel, error: er } = await supabase.from('relatorios_compartilhados').insert({
          cliente_id: clienteId,
          fazenda_id: null,
          tipo_relatorio: 'broca_soltura',
          titulo,
          safra: safraSelecionada,
          data_inicio: dataBase,
          data_fim: dataBase,
          observacoes: `Relatório de execução da soltura de armadilhas de Broca${cliente?.nome ? ` • ${cliente.nome}` : ''}`,
        }).select('*').single();
        if (er || !rel) throw er || new Error('Falha ao criar relatório.');
        const vinculos = itens.map((x) => ({ relatorio_id: rel.id, monitoramento_id: x.id }));
        const { error: ei } = await supabase.from('relatorio_broca_itens').insert(vinculos);
        if (ei) {
          await supabase.from('relatorios_compartilhados').delete().eq('id', rel.id);
          throw ei;
        }
        links.push(`${cliente?.nome || 'Cliente'}: ${linkPublicoRelatorio(rel, cliente?.nome || 'Cliente')}`);
      }
      await carregarRelatoriosCompartilhados();
      alert(`Relatório(s) criado(s) com sucesso.\n\n${links.join('\n\n')}`);
    } catch (e: any) {
      alert(`Não foi possível gerar o relatório: ${e?.message || e}`);
    } finally {
      setGerandoRelatorioCompartilhado(false);
    }
  }

  async function gerarPDFProgramacaoBroca() {
    if (!programacaoBrocaPDF.length) {
      alert(
        'Não há programação de Broca aguardando recolhimento para gerar o PDF.'
      );
      return;
    }

    const relatorio = document.querySelector(
      '.broca-programacao-pdf'
    ) as HTMLElement | null;
    const botao = document.querySelector(
      '.botao-pdf-programacao-broca'
    ) as HTMLButtonElement | null;
    if (!relatorio) return;

    const texto = botao?.textContent || '↓ Baixar PDF colorido';
    let fontesOriginais: string[] = [];

    try {
      if (botao) {
        botao.disabled = true;
        botao.textContent = 'Gerando PDF...';
      }

      relatorio.classList.add('pdf-export');
      const imagens = Array.from(
        relatorio.querySelectorAll('img')
      ) as HTMLImageElement[];
      fontesOriginais = imagens.map((img) => img.src);

      await Promise.all(
        imagens.map(async (img) => {
          if (!img.src || img.src.startsWith('data:')) return;
          try {
            const resposta = await fetch(img.src, { cache: 'no-store' });
            if (!resposta.ok) return;
            const blob = await resposta.blob();
            img.src = await new Promise<string>((resolve, reject) => {
              const leitor = new FileReader();
              leitor.onload = () => resolve(String(leitor.result));
              leitor.onerror = () => reject(leitor.error);
              leitor.readAsDataURL(blob);
            });
          } catch (erro) {
            console.warn('Imagem não incorporada ao PDF de programação:', erro);
          }
        })
      );

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const canvas = await html2canvas(relatorio, {
        scale: 2.2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1500,
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const margem = 7;
      const larguraUtil = 297 - margem * 2;
      const alturaUtil = 210 - margem * 2;
      const escala = Math.min(
        larguraUtil / canvas.width,
        alturaUtil / canvas.height
      );
      const largura = canvas.width * escala;
      const altura = canvas.height * escala;
      const x = (297 - largura) / 2;
      const y = (210 - altura) / 2;

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.97),
        'JPEG',
        x,
        y,
        largura,
        altura,
        undefined,
        'FAST'
      );
      const dataNome = dataProgramacaoPDF.split('-').reverse().join('-');
      pdf.save(`programacao-broca-${dataNome}.pdf`);
    } catch (erro) {
      console.error('Erro ao gerar PDF da programação de Broca:', erro);
      alert('Não foi possível gerar o PDF da programação.');
    } finally {
      const imagens = Array.from(
        relatorio.querySelectorAll('img')
      ) as HTMLImageElement[];
      imagens.forEach((img, i) => {
        if (fontesOriginais[i]) img.src = fontesOriginais[i];
      });
      relatorio.classList.remove('pdf-export');
      if (botao) {
        botao.disabled = false;
        botao.textContent = texto;
      }
    }
  }

  return (
    <>
      <section className="pragas-hero">
        <div>
          <span>INTELIGÊNCIA FITOSSANITÁRIA • SOUZA SILVA</span>
          <h2>Dashboard Fitossanitário</h2>
          <p>
            Histórico, situação da safra e prioridades de monitoramento em uma
            única visão.
          </p>
        </div>

        <div className="pragas-acoes">
          <label className="pragas-safra">
            <small>SAFRA</small>
            <select
              value={safraSelecionada}
              onChange={(e) => setSafraSelecionada(e.target.value)}
            >
              <option value="2021/2022">2021/2022</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </label>

          <button className="pragas-atualizar" onClick={carregar}>
            ↻ Atualizar dados
          </button>
        </div>
      </section>

      {apontamentoBroca && (
        <div className="broca-modal-fundo" onMouseDown={() => !salvandoApontamentoBroca && setApontamentoBroca(null)}>
          <div className="broca-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="broca-modal-topo">
              <div>
                <span>BROCA • APONTAMENTO DE CAMPO</span>
                <h2>Apontar soltura das armadilhas</h2>
                <p>
                  {apontamentoBroca.codigo_fazenda || apontamentoBroca.codigo || '—'} • {nomeFazenda(apontamentoBroca.fazenda_id)} • Talhão(ões) {apontamentoBroca.talhoes || '—'}
                </p>
              </div>
              <button type="button" onClick={() => setApontamentoBroca(null)} disabled={salvandoApontamentoBroca}>×</button>
            </div>

            <form onSubmit={salvarApontamentoBroca}>
              <div className="broca-form-grid">
                <label>
                  <span>Armadilhas programadas</span>
                  <input value={Math.ceil(Number(apontamentoBroca.quantidade_armadilhas || 0))} disabled />
                </label>
                <label>
                  <span>Armadilhas instaladas *</span>
                  <input type="number" min="0" step="1" value={formApontamentoBroca.quantidade_armadilhas_instaladas}
                    onChange={(e) => setFormApontamentoBroca((f) => ({ ...f, quantidade_armadilhas_instaladas: e.target.value }))} />
                </label>
                <label>
                  <span>Data da execução *</span>
                  <input type="date" value={formApontamentoBroca.data_execucao_soltura}
                    onChange={(e) => setFormApontamentoBroca((f) => ({ ...f, data_execucao_soltura: e.target.value }))} />
                </label>
                <label>
                  <span>Situação</span>
                  <input value={(() => { const i=Number(formApontamentoBroca.quantidade_armadilhas_instaladas); const p=Math.ceil(Number(apontamentoBroca.quantidade_armadilhas||0)); return i===0?'Não executado':i<p?'Parcial':'Executado'; })()} disabled />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Responsável pela soltura {Number(formApontamentoBroca.quantidade_armadilhas_instaladas) > 0 ? '*' : ''}</span>
                  <input
                    type="text"
                    placeholder="Nome de quem realizou a soltura"
                    value={formApontamentoBroca.responsavel_soltura}
                    onChange={(e) => setFormApontamentoBroca((f) => ({ ...f, responsavel_soltura: e.target.value }))}
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Justificativa {Number(formApontamentoBroca.quantidade_armadilhas_instaladas) < Math.ceil(Number(apontamentoBroca.quantidade_armadilhas || 0)) ? '*' : ''}</span>
                  <select value={formApontamentoBroca.justificativa_soltura}
                    onChange={(e) => setFormApontamentoBroca((f) => ({ ...f, justificativa_soltura: e.target.value }))}>
                    <option value="">Sem justificativa</option>
                    <option>Falta de armadilhas</option><option>Chuva</option><option>Área sem acesso</option>
                    <option>Operação agrícola no local</option><option>Problema com veículo/equipamento</option>
                    <option>Reprogramado</option><option>Outro</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Fotos e vídeos da soltura</span>
                  <input type="file" accept="image/*,video/*" multiple
                    onChange={(e) => setArquivosBroca(Array.from(e.target.files || []))} />
                  <small>{arquivosBroca.length ? `${arquivosBroca.length} novo(s) arquivo(s) selecionado(s)` : 'Você pode adicionar novas fotos e vídeos mesmo depois de o apontamento já estar salvo.'}</small>
                </label>
                <div style={{ gridColumn: '1 / -1', padding: 14, border: '1px solid #d8e2dc', borderRadius: 12, background: '#f8fbf9' }}>
                  <strong>Evidências já salvas ({evidenciasBrocaExistentes.length})</strong>
                  {carregandoEvidenciasBroca ? (
                    <p style={{ marginBottom: 0 }}>Carregando evidências...</p>
                  ) : evidenciasBrocaExistentes.length === 0 ? (
                    <p style={{ marginBottom: 0 }}>Nenhuma evidência registrada neste apontamento.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
                      {evidenciasBrocaExistentes.map((e: Registro) => (
                        <div key={e.id} style={{ border: '1px solid #e2e8e4', borderRadius: 10, padding: 8, background: '#fff' }}>
                          {String(e.mime_type || '').startsWith('image/') && e.url_temporaria ? (
                            <img src={e.url_temporaria} alt={e.nome_arquivo || 'Evidência'} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                          ) : String(e.mime_type || '').startsWith('video/') && e.url_temporaria ? (
                            <video src={e.url_temporaria} controls style={{ width: '100%', height: 120, borderRadius: 8, background: '#000' }} />
                          ) : null}
                          <small style={{ display: 'block', marginTop: 6, wordBreak: 'break-word' }}>{e.nome_arquivo || 'Arquivo'}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {erroApontamentoBroca && <div className="erro">{erroApontamentoBroca}</div>}
              {sucessoApontamentoBroca && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#e8f5ec', color: '#176b3a', fontWeight: 700 }}>{sucessoApontamentoBroca}</div>}
              <div className="broca-modal-acoes">
                <button type="button" onClick={() => setApontamentoBroca(null)} disabled={salvandoApontamentoBroca}>Cancelar</button>
                <button type="submit" className="botao-verde" disabled={salvandoApontamentoBroca}>{salvandoApontamentoBroca ? 'Salvando...' : 'Salvar apontamento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {novaProgramacaoBroca && (
        <div
          className="broca-modal-fundo"
          onMouseDown={() =>
            !salvandoProgramacaoBroca && setNovaProgramacaoBroca(false)
          }
        >
          <div className="broca-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="broca-modal-topo">
              <div>
                <span>BROCA-DA-CANA • DIATRAEA SACCHARALIS</span>
                <h2>Nova programação de Broca</h2>
                <p>
                  Cadastre a soltura. O recolhimento será programado
                  automaticamente para 3 dias depois.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNovaProgramacaoBroca(false)}
                disabled={salvandoProgramacaoBroca}
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarNovaProgramacaoBroca}>
              <div className="broca-form-grid">
                <label>
                  <span>Cliente *</span>
                  <select
                    value={formBroca.cliente_id}
                    onChange={(e) => {
                      const cliente_id = e.target.value;
                      setFormBroca((f) => ({
                        ...f,
                        cliente_id,
                        fazenda_id: '',
                      }));
                      carregarFazendasProgramacaoBroca(cliente_id);
                    }}
                  >
                    <option value="">Selecione o cliente</option>
                    {clientesPragas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Fazenda *</span>
                  <select
                    value={formBroca.fazenda_id}
                    disabled={!formBroca.cliente_id}
                    onChange={(e) =>
                      setFormBroca((f) => ({
                        ...f,
                        fazenda_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione a fazenda</option>
                    {fazendasProgramacaoBroca.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.codigo ? `${f.codigo} • ` : ''}
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Talhão(ões) *</span>
                  <input
                    value={formBroca.talhoes}
                    placeholder="Ex.: 15 e 24"
                    onChange={(e) =>
                      setFormBroca((f) => ({ ...f, talhoes: e.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Corte</span>
                  <input
                    value={formBroca.corte}
                    placeholder="Ex.: 2º e 3º"
                    onChange={(e) =>
                      setFormBroca((f) => ({ ...f, corte: e.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Área (ha) *</span>
                  <input
                    value={formBroca.area_ha}
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(e) =>
                      setFormBroca((f) => ({ ...f, area_ha: e.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Data de soltura *</span>
                  <input
                    type="date"
                    value={formBroca.data_soltura}
                    onChange={(e) =>
                      setFormBroca((f) => ({
                        ...f,
                        data_soltura: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Recolhimento previsto</span>
                  <input
                    value={
                      formBroca.data_soltura
                        ? somarDiasData(formBroca.data_soltura, 3)
                            .split('-')
                            .reverse()
                            .join('/')
                        : ''
                    }
                    placeholder="Calculado automaticamente"
                    readOnly
                  />
                </label>

                <label>
                  <span>Armadilhas equivalentes</span>
                  <input
                    value={
                      formBroca.area_ha &&
                      Number(String(formBroca.area_ha).replace(',', '.')) > 0
                        ? (
                            Number(
                              String(formBroca.area_ha).replace(',', '.')
                            ) / 30
                          )
                            .toFixed(1)
                            .replace('.', ',')
                        : ''
                    }
                    placeholder="Área ÷ 30"
                    readOnly
                  />
                </label>

                <label className="broca-form-largo">
                  <span>Método</span>
                  <input value={formBroca.metodo} readOnly />
                </label>

                <label className="broca-form-largo">
                  <span>Observações</span>
                  <textarea
                    value={formBroca.observacoes}
                    rows={3}
                    onChange={(e) =>
                      setFormBroca((f) => ({
                        ...f,
                        observacoes: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {erroProgramacaoBroca && (
                <div className="erro-box">{erroProgramacaoBroca}</div>
              )}
              {sucessoProgramacaoBroca && (
                <div className="sucesso-box">✓ {sucessoProgramacaoBroca}</div>
              )}

              <div className="broca-modal-rodape">
                <button
                  type="button"
                  className="voltar"
                  onClick={() => setNovaProgramacaoBroca(false)}
                  disabled={salvandoProgramacaoBroca}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-verde"
                  disabled={salvandoProgramacaoBroca}
                >
                  {salvandoProgramacaoBroca
                    ? 'Salvando...'
                    : 'Salvar programação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="broca-programacao-pdf">
        <div className="bp-cabecalho">
          <div className="bp-marca">
            <img src="/Logo Souza Silva.jpeg" alt="Souza Silva" />
            <div>
              <b>SOUZA SILVA</b>
              <span>CONSULTORIA EM AUDITORIAS DO SETOR AGRÍCOLA</span>
            </div>
          </div>
          <div className="bp-titulo">
            <small>PROGRAMAÇÃO DE CAMPO</small>
            <h1>Monitoramento de Broca-da-cana</h1>
            <p>
              <i>Diatraea saccharalis</i> • Safra {safraSelecionada}
            </p>
          </div>
          {clienteProgramacaoPDF?.logo_url ? (
            <div className="bp-cliente-logo">
              <img
                src={clienteProgramacaoPDF.logo_url}
                alt={clienteProgramacaoPDF.nome}
              />
            </div>
          ) : (
            <div className="bp-cliente-logo bp-sem-logo">CAMPO</div>
          )}
        </div>

        <div className="bp-faixa">
          <div>
            <small>CLIENTE</small>
            <strong>
              {clienteProgramacaoPDF?.nome || 'Programação consolidada'}
            </strong>
          </div>
          <div>
            <small>SOLTURA</small>
            <strong>{dataBR(dataProgramacaoPDF)}</strong>
          </div>
          <div>
            <small>RECOLHIMENTO PREVISTO</small>
            <strong>
              {dataBR(programacaoBrocaPDF[0]?.data_prevista_recolhimento)}
            </strong>
          </div>
          <div>
            <small>MÉTODO</small>
            <strong>1 armadilha / 30 ha</strong>
          </div>
        </div>

        <div className="bp-resumo">
          <div>
            <span>FAZENDAS / GLEBAS</span>
            <b>{new Set(programacaoBrocaPDF.map((x) => x.fazenda_id)).size}</b>
          </div>
          <div>
            <span>ÁREA PROGRAMADA</span>
            <b>{n(somaBroca('area_ha', programacaoBrocaPDF), 2)} ha</b>
          </div>
          <div>
            <span>ARMADILHAS EQUIVALENTES</span>
            <b>
              {n(somaBroca('quantidade_armadilhas', programacaoBrocaPDF), 1)}
            </b>
          </div>
          <div>
            <span>REGISTROS</span>
            <b>{programacaoBrocaPDF.length}</b>
          </div>
        </div>

        <table className="bp-tabela">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Fazenda / Gleba</th>
              <th>Talhão(ões)</th>
              <th>Corte</th>
              <th>Área (ha)</th>
              <th>Armadilhas</th>
              <th>Soltura</th>
              <th>Recolhimento</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {programacaoBrocaPDF.map((x, i) => (
              <tr key={x.id}>
                <td>
                  <b>{x.codigo_fazenda || x.codigo || '—'}</b>
                </td>
                <td>{nomeFazenda(x.fazenda_id).replace(/\s•\s.*$/, '')}</td>
                <td>{x.talhoes || '—'}</td>
                <td>{x.corte || '—'}</td>
                <td>{n(x.area_ha, 2)}</td>
                <td>{n(x.quantidade_armadilhas, 1)}</td>
                <td>{dataBR(x.data_soltura)}</td>
                <td>
                  <b>{dataBR(x.data_prevista_recolhimento)}</b>
                </td>
                <td>{x.observacoes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bp-rodape">
          <div>
            <b>ORIENTAÇÃO DE CAMPO</b>
            <span>
              O recolhimento está previsto para 3 dias após a soltura. Qualquer
              alteração de data deverá ser justificada no sistema.
            </span>
          </div>
          <div className="bp-assinatura">
            <span>Responsável técnico</span>
            <b>Elson Neto</b>
          </div>
        </div>
      </section>

      <section className="painel broca-operacional">
        <div className="titulo broca-operacional-topo">
          <div>
            <span>BROCA • OPERAÇÃO DE CAMPO</span>
            <h2>Programação, recolhimento e resultados</h2>
            <p>
              Fluxo específico da Broca: soltura das armadilhas, recolhimento
              previsto em 3 dias e fechamento do levantamento.
            </p>
          </div>
          <div className="broca-operacional-acoes">
            <button
              className="botao-verde broca-nova-programacao"
              onClick={abrirNovaProgramacaoBroca}
            >
              + Nova programação de Broca
            </button>
            <button
              className="botao-pdf-programacao-broca"
              onClick={gerarPDFProgramacaoBroca}
            >
              ↓ Baixar PDF colorido
            </button>
            <button
              className="botao-verde"
              onClick={gerarRelatoriosSoltura}
              disabled={gerandoRelatorioCompartilhado}
            >
              {gerandoRelatorioCompartilhado ? 'Gerando link...' : '🔗 Gerar relatório da soltura'}
            </button>
            <div className="broca-regra">SOLTURA + 3 DIAS</div>
          </div>
        </div>

        <div className="broca-fluxo">
          <div>
            <b>01</b>
            <strong>Programar</strong>
            <span>Definir fazendas e áreas</span>
          </div>
          <div>
            <b>02</b>
            <strong>Soltar</strong>
            <span>Registrar data de soltura</span>
          </div>
          <div>
            <b>03</b>
            <strong>Recolher</strong>
            <span>Previsão automática +3 dias</span>
          </div>
          <div>
            <b>04</b>
            <strong>Apurar</strong>
            <span>Mariposas, índice e situação</span>
          </div>
        </div>

        <div className="broca-kpis">
          <article>
            <small>LEVANTAMENTOS CONCLUÍDOS</small>
            <strong>{brocaConcluidos.length}</strong>
            <span>Safra {safraSelecionada}</span>
          </article>
          <article>
            <small>AGUARDANDO RECOLHIMENTO</small>
            <strong>{brocaARecolher.length}</strong>
            <span>Programações em aberto</span>
          </article>
          <article>
            <small>ÁREA DOS CONCLUÍDOS</small>
            <strong>{n(somaBroca('area_ha'), 2)} ha</strong>
            <span>Somatório dos registros</span>
          </article>
          <article>
            <small>ARMADILHAS EQUIVALENTES</small>
            <strong>{n(somaBroca('quantidade_armadilhas'), 1)}</strong>
            <span>1 armadilha / 30 ha</span>
          </article>
        </div>

        {brocaARecolher.length > 0 && (
          <div className="broca-bloco">
            <div className="ranking-titulo">
              <span>RECOLHIMENTOS PROGRAMADOS</span>
              <small>Alterações de data deverão ter justificativa</small>
            </div>
            <div className="tabela-wrap">
              <table className="broca-tabela">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Fazenda</th>
                    <th>Talhões</th>
                    <th>Soltura</th>
                    <th>Recolhimento previsto</th>
                    <th>Situação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {brocaARecolher.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.codigo_fazenda || x.codigo || '—'}</strong>
                      </td>
                      <td>{nomeFazenda(x.fazenda_id)}</td>
                      <td>{x.talhoes || '—'}</td>
                      <td>{dataBR(x.data_soltura)}</td>
                      <td>
                        <strong>{dataBR(x.data_prevista_recolhimento)}</strong>
                      </td>
                      <td>
                        <span className={`broca-status ${x.status_soltura ? 'aguardando' : ''}`}>
                          {x.status_soltura === 'Executado'
                            ? `Soltura executada • ${Number(x.quantidade_armadilhas_instaladas ?? 0)} armadilha(s)`
                            : x.status_soltura === 'Parcial'
                            ? `Soltura parcial • ${Number(x.quantidade_armadilhas_instaladas ?? 0)} de ${Math.ceil(Number(x.quantidade_armadilhas ?? 0))} armadilha(s) • ${x.justificativa_soltura || 'Justificativa registrada'}`
                            : x.status_soltura === 'Não executado'
                            ? `Não executado • ${x.justificativa_soltura || 'Justificativa registrada'}`
                            : 'Soltura ainda não apontada'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="botao-verde"
                          onClick={() => abrirApontamentoBroca(x)}
                          style={{ marginRight: 8 }}
                        >
                          {x.status_soltura ? 'Ver apontamento' : 'Apontar soltura'}
                        </button>
                        {!x.status_soltura && (
                          <button
                            type="button"
                            className="broca-excluir-programacao"
                            onClick={() => excluirProgramacaoBroca(x)}
                            title="Excluir somente esta programação"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="broca-bloco relatorios-compartilhados-bloco">
          <div className="ranking-titulo">
            <span>CENTRAL DE RELATÓRIOS COMPARTILHÁVEIS</span>
            <small>Links individuais para clientes • apontamentos + evidências</small>
          </div>
          {relatoriosCompartilhados.length ? (
            <div className="relatorios-grid">
              {relatoriosCompartilhados.filter((r) => r.status === 'ativo').map((r) => {
                const cliente = clientesPragas.find((c) => c.id === r.cliente_id);
                return <article key={r.id} className={`relatorio-link-card ${r.status === 'revogado' ? 'revogado' : ''}`}>
                  <div><small>{r.status === 'ativo' ? '● LINK ATIVO' : '● LINK REVOGADO'}</small><strong>{r.titulo}</strong><span>{cliente?.nome || 'Cliente'} • Safra {r.safra || '—'}</span></div>
                  <div className="relatorio-link-acoes">
                    {r.status === 'ativo' && <><button type="button" onClick={() => window.open(linkPublicoRelatorio(r, cliente?.nome || 'Cliente'), '_blank')}>Visualizar</button><button type="button" onClick={() => copiarLinkRelatorio(r)}>Copiar link</button><button type="button" className="perigo" onClick={() => revogarRelatorio(r)}>Revogar</button></>}
                  </div>
                </article>;
              })}
            </div>
          ) : <div className="relatorios-vazio">Nenhum relatório compartilhável gerado ainda.</div>}
        </div>

        <div className="broca-bloco">
          <div className="ranking-titulo">
            <span>LEVANTAMENTOS REALIZADOS • BROCA</span>
            <small>Dados operacionais gravados no Supabase</small>
          </div>
          <div className="tabela-wrap">
            <table className="broca-tabela">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fazenda</th>
                  <th>Talhões</th>
                  <th>Corte</th>
                  <th>Área</th>
                  <th>Armadilhas</th>
                  <th>Mariposas</th>
                  <th>Índice</th>
                  <th>Soltura</th>
                  <th>Recolhimento</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {brocaConcluidos.length ? (
                  brocaConcluidos.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.codigo_fazenda || x.codigo || '—'}</strong>
                      </td>
                      <td>{nomeFazenda(x.fazenda_id)}</td>
                      <td>{x.talhoes || '—'}</td>
                      <td>{x.corte || '—'}</td>
                      <td>
                        {x.area_ha != null ? `${n(x.area_ha, 2)} ha` : '—'}
                      </td>
                      <td>
                        {x.quantidade_armadilhas != null
                          ? n(x.quantidade_armadilhas, 1)
                          : '—'}
                      </td>
                      <td>{x.mariposas ?? '—'}</td>
                      <td>
                        <strong>
                          {x.indice != null ? n(x.indice, 2) : '—'}
                        </strong>
                      </td>
                      <td>{dataBR(x.data_soltura)}</td>
                      <td>{dataBR(x.data_levantamento)}</td>
                      <td>
                        <span className="broca-status concluido">
                          {x.situacao || 'Concluído'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11}>
                      Nenhum levantamento operacional de Broca encontrado nesta
                      safra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="painel pragas-avancado">
        <div className="titulo pragas-avancado-topo">
          <div>
            <span>PAINEL EXECUTIVO • SAFRA {safraSelecionada}</span>
            <h2>Dashboard avançado de pragas</h2>
            <p>
              Indicadores, tendência e propriedades prioritárias em uma visão
              gerencial.
            </p>
          </div>
          <div className="dash-avancado-selo">DADOS DO SUPABASE</div>
        </div>

        <div className="dash-avancado-kpis">
          <article>
            <small>FAZENDAS MONITORADAS</small>
            <strong>{totalFazendasMonitoradas || '—'}</strong>
            <span>Com registro individual na safra</span>
          </article>
          <article>
            <small>BROCA • ÍNDICE MÉDIO</small>
            <strong>
              {brocaAtual ? `${n(brocaAtual.indice_medio, 2)}%` : '—'}
            </strong>
            <span
              className={
                variacaoBroca !== null && variacaoBroca < 0
                  ? 'tendencia-boa'
                  : variacaoBroca !== null && variacaoBroca > 0
                  ? 'tendencia-alerta'
                  : ''
              }
            >
              {tendenciaBroca}
              {variacaoBroca !== null
                ? ` • ${variacaoBroca > 0 ? '+' : ''}${n(
                    variacaoBroca,
                    2
                  )} p.p.`
                : ''}
            </span>
          </article>
          <article>
            <small>SPHENOPHORUS • MÉDIA</small>
            <strong>
              {sphAtual ? `${n(sphAtual.percentual_medio, 2)}%` : '—'}
            </strong>
            <span
              className={
                variacaoSph !== null && variacaoSph < 0
                  ? 'tendencia-boa'
                  : variacaoSph !== null && variacaoSph > 0
                  ? 'tendencia-alerta'
                  : ''
              }
            >
              {tendenciaSph}
              {variacaoSph !== null
                ? ` • ${variacaoSph > 0 ? '+' : ''}${n(variacaoSph, 2)} p.p.`
                : ''}
            </span>
          </article>
          <article>
            <small>PRIORIDADE DA SAFRA</small>
            <strong className="prioridade-nome">
              {rankingBroca[0]
                ? nomeFazenda(rankingBroca[0].fazenda_id)
                : rankingSph[0]
                ? nomeFazenda(rankingSph[0].fazenda_id)
                : '—'}
            </strong>
            <span>Maior índice individual disponível</span>
          </article>
        </div>

        <div className="dash-avancado-grid">
          <article className="dash-chart-card">
            <div className="dash-card-head">
              <div>
                <small>EVOLUÇÃO HISTÓRICA</small>
                <strong>Broca-da-cana</strong>
              </div>
              <span>2021 — 2026</span>
            </div>
            <div className="dash-colunas">
              {historicoBroca.map((x) => {
                const valor = Number(x.indice_medio || 0);
                return (
                  <div className="dash-coluna-item" key={`adv-b-${x.ano}`}>
                    <b>{n(valor, 2)}%</b>
                    <div className="dash-coluna-trilho">
                      <i
                        style={{
                          height: `${Math.max((valor / maxBroca) * 100, 5)}%`,
                        }}
                      />
                    </div>
                    <span>{x.ano}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="dash-chart-card">
            <div className="dash-card-head">
              <div>
                <small>EVOLUÇÃO HISTÓRICA</small>
                <strong>Sphenophorus levis</strong>
              </div>
              <span>2022 — 2026</span>
            </div>
            <div className="dash-colunas">
              {historicoSph.map(({ ano, registro }) => {
                const valor = Number(registro?.percentual_medio || 0);
                return (
                  <div
                    className={`dash-coluna-item ${
                      !registro ? 'sem-dado' : ''
                    }`}
                    key={`adv-s-${ano}`}
                  >
                    <b>{registro ? `${n(valor, 2)}%` : '—'}</b>
                    <div className="dash-coluna-trilho">
                      {registro && (
                        <i
                          style={{
                            height: `${Math.max((valor / maxSph) * 100, 5)}%`,
                          }}
                        />
                      )}
                    </div>
                    <span>{ano}</span>
                    {!registro && <em>Sem levantamento</em>}
                  </div>
                );
              })}
            </div>
          </article>

          <article className="dash-ranking-card">
            <div className="dash-card-head">
              <div>
                <small>TOP 5 • SAFRA {safraSelecionada}</small>
                <strong>Broca — propriedades prioritárias</strong>
              </div>
            </div>
            <div className="dash-ranking-lista">
              {topBroca.length ? (
                topBroca.map((x, i) => {
                  const valor = Number(x.indice || 0);
                  return (
                    <div className="dash-rank-row" key={`top-b-${x.id}`}>
                      <b>{String(i + 1).padStart(2, '0')}</b>
                      <span>{nomeFazenda(x.fazenda_id)}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(
                              (valor / maxRankingBroca) * 100,
                              3
                            )}%`,
                          }}
                        />
                      </div>
                      <strong>{n(valor, 2)}%</strong>
                    </div>
                  );
                })
              ) : (
                <p className="dash-sem-ranking">
                  Sem registros individuais nesta safra.
                </p>
              )}
            </div>
          </article>

          <article className="dash-ranking-card">
            <div className="dash-card-head">
              <div>
                <small>TOP 5 • SAFRA {safraSelecionada}</small>
                <strong>Sphenophorus — propriedades prioritárias</strong>
              </div>
            </div>
            <div className="dash-ranking-lista">
              {topSph.length ? (
                topSph.map((x, i) => {
                  const valor = Number(x.percentual_infestacao || 0);
                  return (
                    <div className="dash-rank-row" key={`top-s-${x.id}`}>
                      <b>{String(i + 1).padStart(2, '0')}</b>
                      <span>{nomeFazenda(x.fazenda_id)}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(
                              (valor / maxRankingSph) * 100,
                              3
                            )}%`,
                          }}
                        />
                      </div>
                      <strong>{n(valor, 2)}%</strong>
                    </div>
                  );
                })
              ) : (
                <p className="dash-sem-ranking">
                  Sem registros individuais nesta safra.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="painel relatorio-emissao no-print">
        <div className="titulo">
          <div>
            <span>EMISSÃO DE RELATÓRIO</span>
            <h2>Relatório fitossanitário profissional</h2>
            <p>
              Escolha o formato e gere uma versão pronta para impressão ou para
              salvar em PDF.
            </p>
          </div>
        </div>
        <div className="relatorio-opcoes">
          <label className="opcao-relatorio">
            <input
              type="radio"
              name="cor-relatorio"
              checked={relatorioColorido}
              onChange={() => setRelatorioColorido(true)}
            />
            <div>
              <strong>Relatório colorido</strong>
              <span>Apresentação, cliente e auditoria</span>
            </div>
          </label>
          <label className="opcao-relatorio">
            <input
              type="radio"
              name="cor-relatorio"
              checked={!relatorioColorido}
              onChange={() => setRelatorioColorido(false)}
            />
            <div>
              <strong>Econômico / P&B</strong>
              <span>Menor consumo de tinta</span>
            </div>
          </label>
          <label className="opcao-relatorio">
            <input
              type="checkbox"
              checked={relatorioDetalhado}
              onChange={(e) => setRelatorioDetalhado(e.target.checked)}
            />
            <div>
              <strong>Incluir tabela detalhada</strong>
              <span>Safras, propriedades, amostragem e datas</span>
            </div>
          </label>
          <div className="relatorio-botoes">
            <button
              className="botao-imprimir-relatorio"
              onClick={imprimirRelatorio}
            >
              Imprimir
            </button>
            <button
              className="botao-gerar-relatorio"
              onClick={gerarRelatorioPDF}
            >
              ↓ Baixar PDF colorido
            </button>
          </div>
        </div>
      </section>

      <section
        className={`painel relatorio-fito relatorio-impressao ${
          relatorioColorido ? 'relatorio-colorido' : 'relatorio-pb'
        }`}
      >
        <div className="relatorio-cabecalho-print">
          <div className="relatorio-marca-print">
            <img src="/Logo Souza Silva.jpeg" alt="Souza Silva" />
            <div>
              <strong>SOUZA SILVA</strong>
              <span>GESTÃO E INTELIGÊNCIA AGRÍCOLA</span>
            </div>
          </div>
          <div className="relatorio-doc-print">
            <b>RELATÓRIO FITOSSANITÁRIO</b>
            <span>
              {pragaRelatorio === 'broca'
                ? 'Broca-da-cana'
                : 'Sphenophorus levis'}
            </span>
            {clienteRelatorio && <small>{clienteRelatorio.nome}</small>}
          </div>
          {clienteRelatorio?.logo_url && (
            <div className="relatorio-cliente-logo-print">
              <img
                src={clienteRelatorio.logo_url}
                alt={`Logo ${clienteRelatorio.nome}`}
              />
            </div>
          )}
        </div>
        <div className="titulo relatorio-fito-topo">
          <div>
            <span>RELATÓRIOS FITOSSANITÁRIOS</span>
            <h2>Histórico por propriedade</h2>
            <p>
              Compare Broca-da-cana e Sphenophorus ao longo das safras, sem
              transformar anos sem levantamento em zero.
            </p>
          </div>
          <div className="relatorio-selo">BASE HISTÓRICA REAL</div>
        </div>

        <div className="relatorio-filtros">
          <label>
            <small>PRAGA</small>
            <select
              value={pragaRelatorio}
              onChange={(e) => {
                const valor = e.target.value as 'broca' | 'sphenophorus';
                setPragaRelatorio(valor);
                setFazendaRelatorio('todas');
                setAnoInicialRelatorio(valor === 'broca' ? 2021 : 2022);
                setAnoFinalRelatorio(2026);
              }}
            >
              <option value="broca">Broca-da-cana</option>
              <option value="sphenophorus">Sphenophorus levis</option>
            </select>
          </label>

          <label className="relatorio-fazenda">
            <small>FAZENDA / GLEBA</small>
            <select
              value={fazendaRelatorio}
              onChange={(e) => setFazendaRelatorio(e.target.value)}
            >
              <option value="todas">Todas as fazendas</option>
              {fazendasComHistorico.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.codigo ? `${f.codigo} • ` : ''}
                  {f.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <small>SAFRA INICIAL</small>
            <select
              value={anoInicialRelatorio}
              onChange={(e) => setAnoInicialRelatorio(Number(e.target.value))}
            >
              {[2021, 2022, 2023, 2024, 2025, 2026].map((ano) => (
                <option key={ano} value={ano}>
                  {ano}/{ano + 1}
                </option>
              ))}
            </select>
          </label>

          <label>
            <small>SAFRA FINAL</small>
            <select
              value={anoFinalRelatorio}
              onChange={(e) => setAnoFinalRelatorio(Number(e.target.value))}
            >
              {[2021, 2022, 2023, 2024, 2025, 2026].map((ano) => (
                <option key={ano} value={ano}>
                  {ano}/{ano + 1}
                </option>
              ))}
            </select>
          </label>

          <button className="botao-verde" onClick={usarTodoHistorico}>
            Todo o histórico
          </button>
        </div>

        <div className="relatorio-kpis">
          <div>
            <small>PRIMEIRO LEVANTAMENTO</small>
            <strong>
              {primeiroRelatorio ? `${n(primeiroRelatorio.valor, 2)}%` : '—'}
            </strong>
            <span>
              {primeiroRelatorio
                ? `${primeiroRelatorio.ano}/${primeiroRelatorio.ano + 1}`
                : 'Sem levantamento'}
            </span>
          </div>
          <div>
            <small>ÚLTIMO LEVANTAMENTO</small>
            <strong>
              {ultimoRelatorio ? `${n(ultimoRelatorio.valor, 2)}%` : '—'}
            </strong>
            <span>
              {ultimoRelatorio
                ? `${ultimoRelatorio.ano}/${ultimoRelatorio.ano + 1}`
                : 'Sem levantamento'}
            </span>
          </div>
          <div>
            <small>VARIAÇÃO NO PERÍODO</small>
            <strong>
              {variacaoRelatorio === null
                ? '—'
                : `${variacaoRelatorio > 0 ? '+' : ''}${n(
                    variacaoRelatorio,
                    2
                  )} p.p.`}
            </strong>
            <span>Primeiro × último registro</span>
          </div>
          <div>
            <small>MENOR ÍNDICE</small>
            <strong>
              {menorRelatorio === null ? '—' : `${n(menorRelatorio, 2)}%`}
            </strong>
            <span>No período selecionado</span>
          </div>
          <div>
            <small>MAIOR ÍNDICE</small>
            <strong>
              {maiorRelatorio === null ? '—' : `${n(maiorRelatorio, 2)}%`}
            </strong>
            <span>No período selecionado</span>
          </div>
        </div>

        <div className="relatorio-grafico">
          <div className="relatorio-grafico-cabecalho">
            <div>
              <small>EVOLUÇÃO ANO A ANO</small>
              <strong>
                {pragaRelatorio === 'broca'
                  ? 'Broca-da-cana'
                  : 'Sphenophorus levis'}
              </strong>
            </div>
            <span>
              {fazendaRelatorio === 'todas'
                ? 'Todas as fazendas com histórico'
                : nomeFazenda(fazendaRelatorio)}
            </span>
          </div>
          <div className="relatorio-serie">
            {serieRelatorio.map((x) => (
              <div
                className={`relatorio-linha ${
                  x.valor === null ? 'sem-levantamento' : ''
                }`}
                key={`rel-${x.ano}`}
              >
                <b>
                  {x.ano}/{x.ano + 1}
                </b>
                <div className="relatorio-trilho">
                  {x.valor !== null && (
                    <i
                      style={{
                        width: `${Math.max(
                          (Number(x.valor) / maxRelatorio) * 100,
                          3
                        )}%`,
                      }}
                    />
                  )}
                </div>
                <strong>
                  {x.valor === null ? 'Sem levantamento' : `${n(x.valor, 2)}%`}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {relatorioDetalhado && (
          <div className="tabela-wrap relatorio-tabela">
            <table>
              <thead>
                <tr>
                  <th>Safra</th>
                  <th>Fazenda / Gleba</th>
                  <th>Índice</th>
                  <th>Talhões</th>
                  <th>Amostragem</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {historicoRelatorioFiltrado.length ? (
                  historicoRelatorioFiltrado.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong>
                          {x.ano}/{Number(x.ano) + 1}
                        </strong>
                      </td>
                      <td>{nomeFazenda(x.fazenda_id)}</td>
                      <td>
                        <strong>{n(x[campoIndiceRelatorio], 2)}%</strong>
                      </td>
                      <td>{x.quantidade_talhoes ?? '—'}</td>
                      <td>
                        {pragaRelatorio === 'broca'
                          ? `${n(x.entrenos_avaliados)} entrenós`
                          : `${n(x.tocos_avaliados)} tocos • ${n(
                              x.pontos_amostrados
                            )} pontos`}
                      </td>
                      <td>
                        {x.data_referencia
                          ? new Date(
                              `${x.data_referencia}T12:00:00`
                            ).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="relatorio-vazio">
                      Sem levantamento para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {carregando && <Mensagem texto="Carregando monitoramentos..." />}
      {erro && <div className="erro-box">{erro}</div>}

      {!carregando && !erro && !possuiDados && (
        <section className="painel pragas-sem-dados">
          <div className="check">✓</div>
          <span>SAFRA {safraSelecionada}</span>
          <h2>Safra preparada</h2>
          <p>
            Aguardando os primeiros levantamentos de Broca-da-cana e
            Sphenophorus levis. Assim que os registros forem cadastrados, os
            indicadores serão preenchidos automaticamente.
          </p>
        </section>
      )}

      {!carregando && !erro && possuiDados && (
        <>
          <div className="pragas-kpis">
            <article className="praga-kpi">
              <span>BROCA • {anoSafra}</span>
              <strong>
                {brocaAtual ? `${n(brocaAtual.indice_medio, 2)}%` : '—'}
              </strong>
              <small>Índice médio da safra</small>
            </article>

            <article className="praga-kpi">
              <span>VARIAÇÃO BROCA</span>
              <strong
                className={
                  variacaoBroca !== null && variacaoBroca < 0 ? 'praga-bom' : ''
                }
              >
                {variacaoBroca === null
                  ? '—'
                  : `${variacaoBroca > 0 ? '+' : ''}${n(
                      variacaoBroca,
                      2
                    )} p.p.`}
              </strong>
              <small>
                {anoSafra - 1} × {anoSafra}
              </small>
            </article>

            <article className="praga-kpi">
              <span>SPHENOPHORUS • {anoSafra}</span>
              <strong>
                {sphAtual ? `${n(sphAtual.percentual_medio, 2)}%` : '—'}
              </strong>
              <small>Infestação média da safra</small>
            </article>

            <article className="praga-kpi">
              <span>VARIAÇÃO SPHENOPHORUS</span>
              <strong
                className={
                  variacaoSph !== null && variacaoSph < 0 ? 'praga-bom' : ''
                }
              >
                {variacaoSph === null
                  ? '—'
                  : `${variacaoSph > 0 ? '+' : ''}${n(variacaoSph, 2)} p.p.`}
              </strong>
              <small>
                {anoSafra - 1} × {anoSafra}
              </small>
            </article>
          </div>

          <section className="painel pragas-historico">
            <div className="titulo">
              <div>
                <span>SÉRIE HISTÓRICA</span>
                <h2>Evolução fitossanitária</h2>
                <p>
                  Comparação anual dos consolidados registrados no Supabase.
                </p>
              </div>
              <div className="historico-selo">HISTÓRICO REAL</div>
            </div>

            <div className="historico-grid">
              <div className="historico-card">
                <div className="historico-cabecalho">
                  <div>
                    <small>BROCA-DA-CANA</small>
                    <strong>2021 — 2026</strong>
                  </div>
                  <b>{historicoBroca.length} anos</b>
                </div>

                <div className="historico-barras">
                  {historicoBroca.map((x) => {
                    const valor = Number(x.indice_medio || 0);
                    return (
                      <div className="hist-linha" key={`broca-${x.ano}`}>
                        <span>{x.ano}</span>
                        <div className="hist-trilho">
                          <div
                            style={{
                              width: `${Math.max(
                                (valor / maxBroca) * 100,
                                3
                              )}%`,
                            }}
                          />
                        </div>
                        <strong>{n(valor, 2)}%</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="historico-card">
                <div className="historico-cabecalho">
                  <div>
                    <small>SPHENOPHORUS LEVIS</small>
                    <strong>2022 — 2026</strong>
                  </div>
                  <b>2024 sem levantamento</b>
                </div>

                <div className="historico-barras">
                  {historicoSph.map(({ ano, registro }) => {
                    const valor = Number(registro?.percentual_medio || 0);
                    return (
                      <div
                        className={`hist-linha ${
                          !registro ? 'hist-sem-dado' : ''
                        }`}
                        key={`sph-${ano}`}
                      >
                        <span>{ano}</span>
                        <div className="hist-trilho">
                          {registro && (
                            <div
                              style={{
                                width: `${Math.max(
                                  (valor / maxSph) * 100,
                                  3
                                )}%`,
                              }}
                            />
                          )}
                        </div>
                        <strong>
                          {registro ? `${n(valor, 2)}%` : 'Sem levantamento'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="painel pragas-inteligencia">
            <div className="ia-icone">✦</div>
            <div className="ia-conteudo">
              <span>ANÁLISE INTELIGENTE • SAFRA {safraSelecionada}</span>
              <h2>Leitura técnica automática</h2>
              <div className="ia-grid">
                <div>
                  <small>BROCA-DA-CANA</small>
                  <strong>{leituraBroca}</strong>
                  <p>
                    {rankingBroca[0]
                      ? `Maior índice individual registrado: ${nomeFazenda(
                          rankingBroca[0].fazenda_id
                        )} com ${n(rankingBroca[0].indice, 2)}%.`
                      : 'Sem ranking individual disponível para esta safra.'}
                  </p>
                </div>
                <div>
                  <small>SPHENOPHORUS LEVIS</small>
                  <strong>{leituraSph}</strong>
                  <p>
                    {rankingSph[0]
                      ? `Maior infestação individual registrada: ${nomeFazenda(
                          rankingSph[0].fazenda_id
                        )} com ${n(rankingSph[0].percentual_infestacao, 2)}%.`
                      : 'Sem ranking individual disponível para esta safra.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pragas-duas-colunas">
            <section className="painel praga-bloco">
              <div className="titulo">
                <div>
                  <span>BROCA-DA-CANA</span>
                  <h2>Resumo {anoSafra}</h2>
                  <p>Consolidado do levantamento • Safra {safraSelecionada}.</p>
                </div>
              </div>

              <div className="praga-metricas">
                <div>
                  <small>FAZENDAS / GLEBAS</small>
                  <b>
                    {brocaAtual
                      ? n(brocaAtual.quantidade_fazendas_glebas)
                      : '—'}
                  </b>
                </div>
                <div>
                  <small>TALHÕES</small>
                  <b>{brocaAtual ? n(brocaAtual.quantidade_talhoes) : '—'}</b>
                </div>
                <div>
                  <small>ENTRENÓS AVALIADOS</small>
                  <b>{brocaAtual ? n(brocaAtual.entrenos_avaliados) : '—'}</b>
                </div>
                <div>
                  <small>BROCADOS</small>
                  <b>{brocaAtual ? n(brocaAtual.entrenos_brocados) : '—'}</b>
                </div>
              </div>

              <div className="ranking-titulo">
                <span>RANKING DA SAFRA</span>
                <small>Maior índice → menor índice</small>
              </div>
              <div className="praga-lista">
                {rankingBroca.length ? (
                  rankingBroca.map((x) => (
                    <div key={x.id}>
                      <span>{nomeFazenda(x.fazenda_id)}</span>
                      <strong>{n(x.indice, 2)}%</strong>
                    </div>
                  ))
                ) : (
                  <div>
                    <span>Sem registros individuais</span>
                    <strong>—</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="painel praga-bloco">
              <div className="titulo">
                <div>
                  <span>SPHENOPHORUS LEVIS</span>
                  <h2>Resumo {anoSafra}</h2>
                  <p>Consolidado do levantamento • Safra {safraSelecionada}.</p>
                </div>
              </div>

              <div className="praga-metricas">
                <div>
                  <small>FAZENDAS / GLEBAS</small>
                  <b>
                    {sphAtual ? n(sphAtual.quantidade_fazendas_glebas) : '—'}
                  </b>
                </div>
                <div>
                  <small>TALHÕES</small>
                  <b>{sphAtual ? n(sphAtual.quantidade_talhoes) : '—'}</b>
                </div>
                <div>
                  <small>PONTOS</small>
                  <b>{sphAtual ? n(sphAtual.pontos_amostrados) : '—'}</b>
                </div>
                <div>
                  <small>TOCOS AVALIADOS</small>
                  <b>{sphAtual ? n(sphAtual.tocos_avaliados) : '—'}</b>
                </div>
                <div>
                  <small>TOCOS DANIFICADOS</small>
                  <b>{sphAtual ? n(sphAtual.tocos_danificados) : '—'}</b>
                </div>
              </div>

              <div className="ranking-titulo">
                <span>RANKING DA SAFRA</span>
                <small>Maior infestação → menor infestação</small>
              </div>
              <div className="praga-lista">
                {rankingSph.length ? (
                  rankingSph.map((x) => (
                    <div key={x.id}>
                      <span>{nomeFazenda(x.fazenda_id)}</span>
                      <strong>{n(x.percentual_infestacao, 2)}%</strong>
                    </div>
                  ))
                ) : (
                  <div>
                    <span>Sem registros individuais</span>
                    <strong>—</strong>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Auditorias() {
  const [auditorias, setAuditorias] = useState<Registro[]>([]);
  const [clientesAud, setClientesAud] = useState<Registro[]>([]);
  const [fazendasAud, setFazendasAud] = useState<Registro[]>([]);
  const [requisitos, setRequisitos] = useState<Registro[]>([]);
  const [evidencias, setEvidencias] = useState<Registro[]>([]);
  const [vinculosEvidencias, setVinculosEvidencias] = useState<Registro[]>([]);
  const [vinculoEmProcesso, setVinculoEmProcesso] = useState('');
  const [selecionada, setSelecionada] = useState<Registro | null>(null);
  const [nova, setNova] = useState(false);
  const [novoReq, setNovoReq] = useState(false);
  const [carregandoAud, setCarregandoAud] = useState(true);
  const [salvandoAud, setSalvandoAud] = useState(false);
  const [erroAud, setErroAud] = useState('');
  const [sucessoAud, setSucessoAud] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [fazendasSelecionadasAud, setFazendasSelecionadasAud] = useState<string[]>([]);
  const [formAud, setFormAud] = useState({
    cliente_id: '',
    fazenda_id: '',
    tipo_auditoria: 'RenovaBio',
    organismo_auditor: '',
    data_inicio: '',
    data_fim: '',
    status: 'Em preparação',
    auditor_responsavel: '',
    responsavel_interno: '',
    safra: '2026/2027',
    escopo: '',
    observacoes: '',
  });
  const [formReq, setFormReq] = useState({
    codigo_requisito: '',
    descricao: '',
    categoria: '',
    status: 'Pendente',
    evidencia_necessaria: true,
    observacoes: '',
  });

  const nomeCliente = (id: any) =>
    clientesAud.find((x) => x.id === id)?.nome || '—';
  const nomeFazenda = (id: any) =>
    fazendasAud.find((x) => x.id === id)?.nome || 'Todas / não informada';
  const fazendasDoCliente = fazendasAud.filter(
    (x) => !formAud.cliente_id || x.cliente_id === formAud.cliente_id
  );

  function alternarFazendaAuditoria(fazendaId: string) {
    setFazendasSelecionadasAud((atual) =>
      atual.includes(fazendaId)
        ? atual.filter((id) => id !== fazendaId)
        : [...atual, fazendaId]
    );
  }

  function selecionarTodasFazendasAuditoria() {
    setFazendasSelecionadasAud(fazendasDoCliente.map((f) => f.id));
  }

  function limparFazendasAuditoria() {
    setFazendasSelecionadasAud([]);
  }

  async function carregarAuditorias() {
    setCarregandoAud(true);
    setErroAud('');
    const [a, c, f, af] = await Promise.all([
      supabase
        .from('auditorias')
        .select('*')
        .order('criado_em', { ascending: false }),
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('fazendas').select('*').order('nome'),
      supabase.from('auditoria_fazendas').select('auditoria_id,fazenda_id'),
    ]);
    if (a.error) setErroAud(a.error.message);
    if (af.error) setErroAud(af.error.message);

    const vinculos = af.data ?? [];
    const auditoriasComFazendas = (a.data ?? []).map((auditoria) => ({
      ...auditoria,
      fazendas_ids: vinculos
        .filter((v) => v.auditoria_id === auditoria.id)
        .map((v) => v.fazenda_id),
    }));

    setAuditorias(auditoriasComFazendas);
    setClientesAud(c.data ?? []);
    setFazendasAud(f.data ?? []);
    setCarregandoAud(false);
  }
  useEffect(() => {
    carregarAuditorias();
  }, []);

  async function abrirAuditoria(a: Registro) {
    setSelecionada(a);
    setErroAud('');
    setSucessoAud('');
    const r = await supabase
      .from('auditoria_requisitos')
      .select('*')
      .eq('auditoria_id', a.id)
      .order('codigo_requisito');
    const reqs = r.data ?? [];
    setRequisitos(reqs);
    const e = await supabase
      .from('auditoria_evidencias')
      .select('*')
      .eq('auditoria_id', a.id)
      .order('criado_em', { ascending: false });
    if (e.error) setErroAud(e.error.message);
    const evs = e.data ?? [];
    setEvidencias(evs);
    const idsEvidencias = evs.map((x) => x.id);
    if (idsEvidencias.length) {
      const v = await supabase
        .from('auditoria_evidencias_requisitos')
        .select('*')
        .in('evidencia_id', idsEvidencias);
      if (v.error) setErroAud(v.error.message);
      setVinculosEvidencias(v.data ?? []);
    } else setVinculosEvidencias([]);
  }

  async function salvarAuditoria(e: React.FormEvent) {
    e.preventDefault();

    if (!formAud.cliente_id) {
      setErroAud('Selecione o cliente.');
      return;
    }

    if (
      formAud.tipo_auditoria === 'RenovaBio' &&
      fazendasSelecionadasAud.length === 0
    ) {
      setErroAud('Selecione pelo menos uma fazenda para a auditoria RenovaBio.');
      return;
    }

    setSalvandoAud(true);
    setErroAud('');
    setSucessoAud('');

    const ehRenovaBio = formAud.tipo_auditoria === 'RenovaBio';

    const { data, error } = await supabase
      .from('auditorias')
      .insert({
        ...formAud,
        fazenda_id: ehRenovaBio ? null : formAud.fazenda_id || null,
        data_inicio: formAud.data_inicio || null,
        data_fim: formAud.data_fim || null,
        organismo_auditor: formAud.organismo_auditor || null,
        auditor_responsavel: formAud.auditor_responsavel || null,
        responsavel_interno: formAud.responsavel_interno || null,
        safra: formAud.safra || null,
        escopo: formAud.escopo || null,
        observacoes: formAud.observacoes || null,
      })
      .select()
      .single();

    if (error || !data) {
      setErroAud(error?.message || 'Não foi possível criar a auditoria.');
      setSalvandoAud(false);
      return;
    }

    if (ehRenovaBio) {
      const registrosFazendas = fazendasSelecionadasAud.map((fazendaId) => ({
        auditoria_id: data.id,
        fazenda_id: fazendaId,
      }));

      const { error: erroFazendas } = await supabase
        .from('auditoria_fazendas')
        .insert(registrosFazendas);

      if (erroFazendas) {
        await supabase.from('auditorias').delete().eq('id', data.id);
        setErroAud(
          `A auditoria não foi salva porque houve erro ao vincular as fazendas: ${erroFazendas.message}`
        );
        setSalvandoAud(false);
        return;
      }
    }

    setNova(false);
    setFazendasSelecionadasAud([]);
    setSucessoAud('Auditoria criada com sucesso.');
    await carregarAuditorias();
    await abrirAuditoria({
      ...data,
      fazendas_ids: ehRenovaBio ? fazendasSelecionadasAud : [],
    });
    setSalvandoAud(false);
  }

  async function salvarRequisito(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionada || !formReq.descricao.trim()) return;
    setSalvandoAud(true);
    setErroAud('');
    const { error } = await supabase.from('auditoria_requisitos').insert({
      auditoria_id: selecionada.id,
      ...formReq,
      codigo_requisito: formReq.codigo_requisito || null,
      categoria: formReq.categoria || null,
      observacoes: formReq.observacoes || null,
    });
    if (error) setErroAud(error.message);
    else {
      setNovoReq(false);
      setFormReq({
        codigo_requisito: '',
        descricao: '',
        categoria: '',
        status: 'Pendente',
        evidencia_necessaria: true,
        observacoes: '',
      });
      await abrirAuditoria(selecionada);
    }
    setSalvandoAud(false);
  }

  async function mudarStatusReq(req: Registro, status: string) {
    const { error } = await supabase
      .from('auditoria_requisitos')
      .update({
        status,
        conformidade: status === 'Atende',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', req.id);
    if (error) setErroAud(error.message);
    else if (selecionada) await abrirAuditoria(selecionada);
  }

  async function enviarEvidencia(req: Registro, arquivo: File) {
    if (!selecionada) return;
    if (arquivo.size > 50 * 1024 * 1024) {
      setErroAud('O arquivo deve ter no máximo 50 MB.');
      return;
    }
    setErroAud('');
    setSucessoAud('');
    const limpo = arquivo.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const caminho = `${selecionada.cliente_id}/${selecionada.id}/${
      req.id
    }/${Date.now()}-${limpo}`;
    const up = await supabase.storage
      .from('auditorias-documentos')
      .upload(caminho, arquivo, {
        contentType: arquivo.type || undefined,
        upsert: false,
      });
    if (up.error) {
      setErroAud(up.error.message);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const ins = await supabase.from('auditoria_evidencias').insert({
      requisito_id: req.id,
      cliente_id: selecionada.cliente_id,
      fazenda_id: selecionada.fazenda_id || null,
      auditoria_id: selecionada.id,
      tipo_evidencia: 'Documento',
      nome_arquivo: arquivo.name,
      storage_path: caminho,
      mime_type: arquivo.type || null,
      tamanho_bytes: arquivo.size,
      status: 'ativo',
      criado_por: userData.user?.id || null,
    });
    if (ins.error) {
      await supabase.storage.from('auditorias-documentos').remove([caminho]);
      setErroAud(ins.error.message);
      return;
    }
    setSucessoAud('Documento enviado com sucesso.');
    await abrirAuditoria(selecionada);
  }

  async function alternarVinculoEvidencia(ev: Registro, requisitoId: string) {
    const chave = `${ev.id}:${requisitoId}`;
    if (vinculoEmProcesso === chave) return;
    const existente = vinculosEvidencias.find(
      (v) => v.evidencia_id === ev.id && v.requisito_id === requisitoId
    );
    setVinculoEmProcesso(chave);
    setErroAud('');
    setSucessoAud('');
    try {
      if (existente) {
        const { error } = await supabase
          .from('auditoria_evidencias_requisitos')
          .delete()
          .eq('id', existente.id);
        if (error) throw error;
        setSucessoAud('Vínculo removido.');
      } else {
        const { error } = await supabase
          .from('auditoria_evidencias_requisitos')
          .upsert(
            { evidencia_id: ev.id, requisito_id: requisitoId },
            { onConflict: 'evidencia_id,requisito_id', ignoreDuplicates: true }
          );
        if (error && error.code !== '23505') throw error;
        setSucessoAud('Documento vinculado ao requisito.');
      }
      if (selecionada) await abrirAuditoria(selecionada);
    } catch (error: any) {
      setErroAud(error?.message || 'Não foi possível atualizar o vínculo.');
    } finally {
      setVinculoEmProcesso('');
    }
  }

  async function abrirArquivo(ev: Registro) {
    if (!ev.storage_path) {
      setErroAud('Este registro não possui caminho de arquivo.');
      return;
    }
    const { data, error } = await supabase.storage
      .from('auditorias-documentos')
      .createSignedUrl(ev.storage_path, 3600);
    if (error || !data?.signedUrl) {
      setErroAud(error?.message || 'Não foi possível abrir o documento.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const lista = auditorias.filter(
    (a) =>
      (!filtroCliente || a.cliente_id === filtroCliente) &&
      (!filtroStatus || a.status === filtroStatus)
  );
  const pendencias = auditorias.filter((a) =>
    ['Pendente', 'Em preparação', 'Em andamento'].includes(a.status || '')
  ).length;
  const concluidas = auditorias.filter((a) =>
    ['Concluída', 'Concluida', 'Finalizada'].includes(a.status || '')
  ).length;
  const reqAtende = requisitos.filter((r) => r.status === 'Atende').length;

  if (selecionada)
    return (
      <div className="aud-wrap">
        <section className="aud-hero">
          <div>
            <span>GESTÃO DE CONFORMIDADE</span>
            <h2>{selecionada.tipo_auditoria}</h2>
            <p>
              {nomeCliente(selecionada.cliente_id)} •{' '}
              {nomeFazenda(selecionada.fazenda_id)} •{' '}
              {selecionada.safra || 'Safra não informada'}
            </p>
          </div>
          <div className="aud-actions">
            <button
              className="botao-secundario"
              onClick={() => {
                setSelecionada(null);
                setRequisitos([]);
                setEvidencias([]);
                setVinculosEvidencias([]);
              }}
            >
              ← Auditorias
            </button>
            <ImportadorDocumentos
              auditoria={selecionada}
              onImportado={() => abrirAuditoria(selecionada)}
            />
            <button className="botao-verde" onClick={() => setNovoReq(true)}>
              + Requisito
            </button>
          </div>
        </section>
        {erroAud && <div className="erro-box">{erroAud}</div>}
        {sucessoAud && <div className="aud-sucesso">✓ {sucessoAud}</div>}
        <div className="aud-kpis">
          <div>
            <span>REQUISITOS</span>
            <strong>{requisitos.length}</strong>
          </div>
          <div>
            <span>ATENDE</span>
            <strong>{reqAtende}</strong>
          </div>
          <div>
            <span>PENDENTES</span>
            <strong>
              {requisitos.filter((r) => r.status === 'Pendente').length}
            </strong>
          </div>
          <div>
            <span>EVIDÊNCIAS</span>
            <strong>{evidencias.length}</strong>
          </div>
        </div>
        <section className="painel">
          <div className="titulo">
            <div>
              <span>CHECKLIST</span>
              <h2>Requisitos da Auditoria</h2>
              <p>Status, conformidade e evidências documentais.</p>
            </div>
          </div>
          <div className="aud-req-list">
            {requisitos.length ? (
              requisitos.map((req) => {
                const evs = evidencias.filter(
                  (e) =>
                    e.requisito_id === req.id ||
                    vinculosEvidencias.some(
                      (v) =>
                        v.evidencia_id === e.id && v.requisito_id === req.id
                    )
                );
                return (
                  <article className="aud-req" key={req.id}>
                    <div className="aud-req-top">
                      <div>
                        <small>
                          {req.codigo_requisito || 'REQUISITO'}{' '}
                          {req.categoria ? `• ${req.categoria}` : ''}
                        </small>
                        <h3>{req.descricao}</h3>
                      </div>
                      <select
                        value={req.status || 'Pendente'}
                        onChange={(e) => mudarStatusReq(req, e.target.value)}
                      >
                        <option>Pendente</option>
                        <option>Atende</option>
                        <option>Não atende</option>
                        <option>Não aplicável</option>
                      </select>
                    </div>
                    {req.observacoes && <p>{req.observacoes}</p>}
                    <div className="aud-evidencias">
                      {evs.map((ev) => (
                        <button key={ev.id} onClick={() => abrirArquivo(ev)}>
                          ▱ {ev.nome_arquivo || 'Documento'}
                        </button>
                      ))}
                      <label className="aud-upload">
                        ＋ Enviar evidência
                        <input
                          type="file"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) enviarEvidencia(req, f);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="vazio">
                <div className="check">✓</div>
                <h3>Nenhum requisito cadastrado</h3>
                <p>Cadastre o primeiro requisito desta auditoria.</p>
              </div>
            )}
          </div>
        </section>
        <ImportadorBonsucro auditoria={selecionada} />
        <section className="painel">
          <div className="titulo">
            <div>
              <span>ARQUIVO DIGITAL</span>
              <h2>Documentos da Auditoria</h2>
              <p>
                Abra os arquivos e vincule cada documento a um ou vários
                requisitos.
              </p>
            </div>
          </div>
          {evidencias.filter((ev) => !ev.requisito_id).length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {evidencias
                .filter((ev) => !ev.requisito_id)
                .map((ev) => (
                  <article
                    key={ev.id}
                    style={{
                      border: '1px solid #dfe9e3',
                      borderRadius: 12,
                      padding: 12,
                      background: '#fbfdfb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="botao-secundario"
                        onClick={() => abrirArquivo(ev)}
                      >
                        ▱ {ev.nome_arquivo || 'Documento'}
                      </button>
                      <small style={{ color: '#55786a', fontWeight: 800 }}>
                        {ev.categoria || 'Documentação geral'}
                      </small>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <small
                        style={{
                          display: 'block',
                          fontWeight: 900,
                          color: '#35634f',
                          marginBottom: 6,
                        }}
                      >
                        VINCULAR A REQUISITOS
                      </small>
                      {requisitos.length ? (
                        <div
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                        >
                          {requisitos.map((req) => {
                            const marcado = vinculosEvidencias.some(
                              (v) =>
                                v.evidencia_id === ev.id &&
                                v.requisito_id === req.id
                            );
                            return (
                              <label
                                key={req.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  border: '1px solid #dbe7df',
                                  borderRadius: 8,
                                  padding: '7px 9px',
                                  cursor: 'pointer',
                                  background: marcado ? '#eaf7ee' : '#fff',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  disabled={
                                    vinculoEmProcesso === `${ev.id}:${req.id}`
                                  }
                                  onChange={() =>
                                    alternarVinculoEvidencia(ev, req.id)
                                  }
                                />
                                <span style={{ fontSize: 10, fontWeight: 800 }}>
                                  {req.codigo_requisito
                                    ? `${req.codigo_requisito} • `
                                    : ''}
                                  {req.descricao}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#789086' }}>
                          Cadastre os requisitos para poder vincular os
                          documentos.
                        </span>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <span style={{ color: '#789086', fontSize: 12 }}>
              Nenhum documento geral importado nesta auditoria.
            </span>
          )}
        </section>
        {novoReq && (
          <div className="aud-modal">
            <form onSubmit={salvarRequisito} className="aud-form">
              <div className="aud-form-head">
                <div>
                  <span>NOVO ITEM</span>
                  <h2>Requisito da Auditoria</h2>
                </div>
                <button type="button" onClick={() => setNovoReq(false)}>
                  ×
                </button>
              </div>
              <div className="aud-grid">
                <label>
                  <span>Código</span>
                  <input
                    value={formReq.codigo_requisito}
                    onChange={(e) =>
                      setFormReq({
                        ...formReq,
                        codigo_requisito: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>Categoria</span>
                  <input
                    value={formReq.categoria}
                    onChange={(e) =>
                      setFormReq({ ...formReq, categoria: e.target.value })
                    }
                  />
                </label>
                <label className="aud-col2">
                  <span>Descrição *</span>
                  <textarea
                    required
                    value={formReq.descricao}
                    onChange={(e) =>
                      setFormReq({ ...formReq, descricao: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={formReq.status}
                    onChange={(e) =>
                      setFormReq({ ...formReq, status: e.target.value })
                    }
                  >
                    <option>Pendente</option>
                    <option>Atende</option>
                    <option>Não atende</option>
                    <option>Não aplicável</option>
                  </select>
                </label>
                <label>
                  <span>Evidência necessária</span>
                  <select
                    value={formReq.evidencia_necessaria ? 'sim' : 'nao'}
                    onChange={(e) =>
                      setFormReq({
                        ...formReq,
                        evidencia_necessaria: e.target.value === 'sim',
                      })
                    }
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </label>
                <label className="aud-col2">
                  <span>Observações</span>
                  <textarea
                    value={formReq.observacoes}
                    onChange={(e) =>
                      setFormReq({ ...formReq, observacoes: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="aud-form-actions">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => setNovoReq(false)}
                >
                  Cancelar
                </button>
                <button className="botao-verde" disabled={salvandoAud}>
                  {salvandoAud ? 'Salvando...' : 'Salvar requisito'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );

  return (
    <div className="aud-wrap">
      <section className="aud-hero">
        <div>
          <span>GESTÃO • AUDITORIAS E CERTIFICAÇÕES</span>
          <h2>Central de Auditorias</h2>
          <p>RenovaBio, Bonsucro e demais processos de conformidade.</p>
        </div>
        <button className="botao-verde" onClick={() => setNova(true)}>
          + Nova Auditoria
        </button>
      </section>
      {erroAud && <div className="erro-box">{erroAud}</div>}
      {sucessoAud && <div className="aud-sucesso">✓ {sucessoAud}</div>}
      <div className="aud-kpis">
        <div>
          <span>TOTAL</span>
          <strong>{auditorias.length}</strong>
        </div>
        <div>
          <span>EM ANDAMENTO / PENDENTES</span>
          <strong>{pendencias}</strong>
        </div>
        <div>
          <span>CONCLUÍDAS</span>
          <strong>{concluidas}</strong>
        </div>
        <div>
          <span>CLIENTES COM AUDITORIA</span>
          <strong>{new Set(auditorias.map((a) => a.cliente_id)).size}</strong>
        </div>
      </div>
      <section className="painel">
        <div className="titulo">
          <div>
            <span>CONTROLE</span>
            <h2>Auditorias cadastradas</h2>
            <p>Abra uma auditoria para gerenciar requisitos e documentos.</p>
          </div>
          <div className="aud-filtros">
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              <option value="">Todos os clientes</option>
              {clientesAud.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option>Em preparação</option>
              <option>Em andamento</option>
              <option>Pendente</option>
              <option>Concluída</option>
            </select>
          </div>
        </div>
        {carregandoAud ? (
          <Mensagem texto="Carregando auditorias..." />
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>TIPO</th>
                  <th>CLIENTE</th>
                  <th>FAZENDA</th>
                  <th>SAFRA</th>
                  <th>PERÍODO</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => (
                  <tr
                    key={a.id}
                    className="linha-talhao"
                    onClick={() => abrirAuditoria(a)}
                  >
                    <td>
                      <strong>{a.tipo_auditoria}</strong>
                    </td>
                    <td>{nomeCliente(a.cliente_id)}</td>
                    <td>
                      {a.tipo_auditoria === 'RenovaBio' &&
                      Array.isArray(a.fazendas_ids) &&
                      a.fazendas_ids.length
                        ? a.fazendas_ids
                            .map((id: string) => nomeFazenda(id))
                            .join(', ')
                        : nomeFazenda(a.fazenda_id)}
                    </td>
                    <td>{a.safra || '—'}</td>
                    <td>
                      {a.data_inicio || '—'}{' '}
                      {a.data_fim ? `→ ${a.data_fim}` : ''}
                    </td>
                    <td>
                      <span className="aud-status">{a.status || '—'}</span>
                    </td>
                    <td className="abrir">Abrir →</td>
                  </tr>
                ))}
                {!lista.length && (
                  <tr>
                    <td colSpan={7}>Nenhuma auditoria encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {nova && (
        <div className="aud-modal">
          <form onSubmit={salvarAuditoria} className="aud-form">
            <div className="aud-form-head">
              <div>
                <span>NOVO PROCESSO</span>
                <h2>Nova Auditoria</h2>
              </div>
              <button type="button" onClick={() => setNova(false)}>
                ×
              </button>
            </div>
            <div className="aud-grid">
              <label>
                <span>Cliente *</span>
                <select
                  required
                  value={formAud.cliente_id}
                  onChange={(e) => {
                    setFormAud({
                      ...formAud,
                      cliente_id: e.target.value,
                      fazenda_id: '',
                    });
                    setFazendasSelecionadasAud([]);
                  }}
                >
                  <option value="">Selecione</option>
                  {clientesAud.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              {formAud.tipo_auditoria === 'RenovaBio' ? (
                <div className="aud-col2">
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Fazendas incluídas na auditoria *
                  </span>

                  {!formAud.cliente_id ? (
                    <div
                      style={{
                        padding: 12,
                        border: '1px solid #d7e1db',
                        borderRadius: 10,
                        color: '#66736c',
                        background: '#f8faf9',
                      }}
                    >
                      Selecione primeiro o cliente.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 10,
                        }}
                      >
                        <button
                          type="button"
                          className="botao-secundario"
                          onClick={selecionarTodasFazendasAuditoria}
                        >
                          Selecionar todas
                        </button>
                        <button
                          type="button"
                          className="botao-secundario"
                          onClick={limparFazendasAuditoria}
                        >
                          Limpar seleção
                        </button>
                        <span
                          style={{
                            alignSelf: 'center',
                            color: '#66736c',
                            fontSize: 13,
                          }}
                        >
                          {fazendasSelecionadasAud.length} selecionada(s)
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(230px, 1fr))',
                          gap: 8,
                          maxHeight: 230,
                          overflowY: 'auto',
                          padding: 10,
                          border: '1px solid #d7e1db',
                          borderRadius: 12,
                          background: '#f8faf9',
                        }}
                      >
                        {fazendasDoCliente.map((f) => (
                          <label
                            key={f.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 9,
                              padding: '9px 10px',
                              border: '1px solid #e2e9e5',
                              borderRadius: 9,
                              background: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={fazendasSelecionadasAud.includes(f.id)}
                              onChange={() => alternarFazendaAuditoria(f.id)}
                              style={{ width: 17, height: 17 }}
                            />
                            <span>{f.nome}</span>
                          </label>
                        ))}

                        {!fazendasDoCliente.length && (
                          <span style={{ color: '#8a9690' }}>
                            Nenhuma fazenda cadastrada para este cliente.
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <label>
                  <span>Fazenda</span>
                  <select
                    value={formAud.fazenda_id}
                    onChange={(e) =>
                      setFormAud({ ...formAud, fazenda_id: e.target.value })
                    }
                  >
                    <option value="">Todas / não informar</option>
                    {fazendasDoCliente.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span>Tipo *</span>
                <select
                  value={formAud.tipo_auditoria}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    setFormAud({
                      ...formAud,
                      tipo_auditoria: tipo,
                      fazenda_id: '',
                    });
                    setFazendasSelecionadasAud([]);
                  }}
                >
                  <option>RenovaBio</option>
                  <option>Bonsucro</option>
                  <option>Interna</option>
                  <option>Outra</option>
                </select>
              </label>
              <label>
                <span>Safra</span>
                <input
                  value={formAud.safra}
                  onChange={(e) =>
                    setFormAud({ ...formAud, safra: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Data inicial</span>
                <input
                  type="date"
                  value={formAud.data_inicio}
                  onChange={(e) =>
                    setFormAud({ ...formAud, data_inicio: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Data final</span>
                <input
                  type="date"
                  value={formAud.data_fim}
                  onChange={(e) =>
                    setFormAud({ ...formAud, data_fim: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Organismo auditor</span>
                <input
                  value={formAud.organismo_auditor}
                  onChange={(e) =>
                    setFormAud({
                      ...formAud,
                      organismo_auditor: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={formAud.status}
                  onChange={(e) =>
                    setFormAud({ ...formAud, status: e.target.value })
                  }
                >
                  <option>Em preparação</option>
                  <option>Em andamento</option>
                  <option>Pendente</option>
                  <option>Concluída</option>
                </select>
              </label>
              <label>
                <span>Auditor responsável</span>
                <input
                  value={formAud.auditor_responsavel}
                  onChange={(e) =>
                    setFormAud({
                      ...formAud,
                      auditor_responsavel: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Responsável interno</span>
                <input
                  value={formAud.responsavel_interno}
                  onChange={(e) =>
                    setFormAud({
                      ...formAud,
                      responsavel_interno: e.target.value,
                    })
                  }
                />
              </label>
              <label className="aud-col2">
                <span>Escopo</span>
                <textarea
                  value={formAud.escopo}
                  onChange={(e) =>
                    setFormAud({ ...formAud, escopo: e.target.value })
                  }
                />
              </label>
              <label className="aud-col2">
                <span>Observações</span>
                <textarea
                  value={formAud.observacoes}
                  onChange={(e) =>
                    setFormAud({ ...formAud, observacoes: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="aud-form-actions">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setNova(false)}
              >
                Cancelar
              </button>
              <button className="botao-verde" disabled={salvandoAud}>
                {salvandoAud ? 'Salvando...' : 'Criar auditoria'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Modulo({ tela }: { tela: Tela }) {
  return (
    <>
      <section className="faixa">
        <span>MÓDULO SOUZA SILVA</span>

        <h2>{tela}</h2>

        <p>
          {tela === 'Aviação Agrícola e Drones'
            ? 'Operações aéreas, drones, aplicações e rastreabilidade agrícola.'
            : 'Módulo integrado à estrutura da plataforma.'}
        </p>
      </section>

      <section className="painel">
        <div className="vazio">
          <div className="check">✓</div>

          <h3>Módulo conectado à estrutura do sistema</h3>

          <p>
            {tela === 'Aviação Agrícola e Drones'
              ? 'Estrutura preparada para integração com a tabela operacoes_aereas do Supabase.'
              : 'Esta tela será ligada aos registros reais nas próximas etapas.'}
          </p>
        </div>
      </section>
    </>
  );
}

function Kpi({ titulo, valor, onClick }: any) {
  return (
    <button className="kpi" onClick={onClick}>
      <span>{titulo.toUpperCase()}</span>

      <strong>{valor}</strong>

      <small>Ver detalhes →</small>
    </button>
  );
}

function Mensagem({ texto }: { texto: string }) {
  return (
    <div className="mensagem">
      <div className="spinner" />
      <strong>{texto}</strong>
    </div>
  );
}

const css = `

/* ===== AUDITORIAS SOUZA SILVA ===== */
.aud-wrap{display:flex;flex-direction:column;gap:14px}.aud-hero{padding:24px 27px;border-radius:18px;background:linear-gradient(135deg,#0b3b28,#176b49);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:20px}.aud-hero span{font-size:9px;font-weight:900;letter-spacing:1.4px;color:#efc94d}.aud-hero h2{margin:6px 0 5px;font-size:25px}.aud-hero p{margin:0;color:#d4e7dc;font-size:10px}.aud-actions{display:flex;gap:8px}.aud-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.aud-kpis>div{background:#fff;border:1px solid #dce6e0;border-radius:14px;padding:17px}.aud-kpis span{display:block;color:#6f857a;font-size:8px;font-weight:900;letter-spacing:.7px}.aud-kpis strong{display:block;margin-top:7px;color:#163f2d;font-size:24px}.aud-filtros{display:flex;gap:8px}.aud-filtros select,.aud-req select{height:38px;border:1px solid #d6e2db;border-radius:9px;background:#fff;padding:0 10px;color:#38584a;font-weight:700}.aud-sucesso{padding:12px 15px;border:1px solid #b9dfc6;border-radius:11px;background:#effaf2;color:#257449;font-size:10px;font-weight:800}.aud-status{display:inline-block;padding:6px 9px;border-radius:12px;background:#eef5f0;color:#347556;font-size:8px;font-weight:900}.aud-req-list{display:flex;flex-direction:column;gap:10px;margin-top:18px}.aud-req{border:1px solid #dce6e0;border-radius:14px;padding:16px;background:#fff}.aud-req-top{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.aud-req small{font-size:8px;color:#789084;font-weight:900}.aud-req h3{margin:5px 0 0;color:#183f2e;font-size:12px}.aud-req p{color:#71857b;font-size:9px}.aud-evidencias{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #edf1ee}.aud-evidencias button,.aud-upload{border:1px solid #d5e4db;border-radius:9px;background:#f7fbf8;color:#2f7452;padding:8px 10px;font-size:8px;font-weight:850;cursor:pointer}.aud-upload input{display:none}.aud-modal{position:fixed;inset:0;z-index:9999;background:rgba(4,24,15,.72);display:grid;place-items:center;padding:25px;overflow:auto}.aud-form{width:min(820px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.35)}.aud-form-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.aud-form-head span{font-size:8px;color:#39805e;font-weight:900;letter-spacing:1px}.aud-form-head h2{margin:4px 0;color:#173f2d}.aud-form-head>button{border:0;background:#eef4f0;width:34px;height:34px;border-radius:9px;font-size:20px;cursor:pointer}.aud-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.aud-grid label{display:flex;flex-direction:column;gap:6px}.aud-grid label>span{font-size:8px;color:#607b6e;font-weight:900}.aud-grid input,.aud-grid select,.aud-grid textarea{box-sizing:border-box;width:100%;border:1px solid #d3dfd8;border-radius:9px;padding:10px 11px;background:#fff;color:#243d32;font:inherit;font-size:10px}.aud-grid textarea{min-height:75px;resize:vertical}.aud-col2{grid-column:1/-1}.aud-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}@media(max-width:900px){.aud-kpis{grid-template-columns:1fr 1fr}.aud-grid{grid-template-columns:1fr}.aud-col2{grid-column:auto}.aud-hero{align-items:flex-start;flex-direction:column}.aud-filtros{flex-direction:column}}

/* ===== PAINEL EXECUTIVO SOUZA SILVA ===== */
.dashboard-ia{display:flex;flex-direction:column;gap:14px}
.dash-capa{min-height:180px;border-radius:22px;overflow:hidden;padding:30px 34px;display:flex;justify-content:space-between;align-items:flex-end;color:#fff;background:
linear-gradient(90deg,rgba(3,33,22,.96),rgba(6,67,42,.78),rgba(7,51,35,.40)),
radial-gradient(circle at 82% 30%,rgba(239,191,63,.42),transparent 24%),
linear-gradient(135deg,#0b3527,#18714a)}
.dash-capa-conteudo>span{font-size:10px;font-weight:900;letter-spacing:1.8px;color:#f0c74e}
.dash-capa h2{font-size:34px;margin:8px 0 6px}.dash-capa p{margin:0;color:#dcebe4;font-size:12px;letter-spacing:.5px}
.dash-data{min-width:250px;padding:17px 19px;border:1px solid rgba(255,255,255,.18);border-radius:15px;background:rgba(3,31,21,.45);backdrop-filter:blur(8px)}
.dash-data small{display:block;color:#a8c8ba;font-size:9px;font-weight:900;letter-spacing:1.4px}.dash-data strong{display:block;margin-top:7px;text-transform:capitalize;font-size:14px}
.dash-filtros{display:grid;grid-template-columns:1.25fr 1.25fr 1fr .8fr;gap:10px;padding:14px;border:1px solid #d8e4dd;border-radius:17px;background:#fff}
.dash-filtros label{display:flex;flex-direction:column;gap:6px}.dash-filtros span{font-size:9px;font-weight:900;color:#547066}.dash-filtros select{height:40px;border:1px solid #d7e2dc;border-radius:10px;padding:0 11px;background:#f8fbf9;color:#234c3d;font-weight:700}
.dash-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dash-kpi{min-height:105px;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:17px;color:#fff;text-align:left;display:flex;align-items:center;gap:15px;box-shadow:0 10px 25px rgba(20,60,43,.08)}
.dash-kpi i{width:49px;height:49px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.13);font-size:23px;font-style:normal}
.dash-kpi div{display:flex;flex-direction:column}.dash-kpi span{font-size:11px}.dash-kpi strong{font-size:28px;line-height:1.05;margin:4px 0}.dash-kpi small{font-size:9px;color:rgba(255,255,255,.72)}
.dash-kpi.verde{background:linear-gradient(135deg,#0b6b3b,#064d31)}.dash-kpi.azul{background:linear-gradient(135deg,#12669a,#0b416c)}.dash-kpi.ouro{background:linear-gradient(135deg,#887014,#4e4414)}.dash-kpi.turquesa{background:linear-gradient(135deg,#087d75,#07524f)}
.dash-grid-principal{display:grid;grid-template-columns:1.55fr 1fr .82fr;gap:12px}.dash-grid-secundario{display:grid;grid-template-columns:1.15fr 1fr .9fr;gap:12px}
.dash-card{min-width:0;border:1px solid #d9e5de;border-radius:17px;background:#fff;padding:16px;box-shadow:0 7px 22px rgba(20,60,43,.05)}
.dash-card-titulo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.dash-card-titulo>div{display:flex;align-items:center;gap:9px}.dash-card-titulo b{color:#167552}.dash-card-titulo span{font-size:13px;font-weight:900;color:#183f32}.dash-card-titulo small{font-size:8px;font-weight:900;letter-spacing:1.2px;color:#7b9288}.dash-card-titulo button{border:0;background:transparent;color:#167552;font-size:10px;font-weight:900}
.mapa-placeholder{height:285px;position:relative;overflow:hidden;border-radius:13px;background:
linear-gradient(30deg,rgba(37,113,70,.28) 12%,transparent 12.5%,transparent 87%,rgba(37,113,70,.2) 87.5%),
linear-gradient(150deg,rgba(198,168,59,.22) 12%,transparent 12.5%,transparent 87%,rgba(198,168,59,.18) 87.5%),
linear-gradient(135deg,#8ca479,#526e4f)}
.mapa-grade{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);background-size:48px 48px;transform:rotate(-8deg) scale(1.2)}
.mapa-pin{position:absolute;color:#fff;font-size:24px;text-shadow:0 2px 8px #173d2d}.mapa-pin span{display:block;margin-left:16px;margin-top:-5px;padding:6px 9px;border-radius:8px;background:rgba(5,38,26,.82);font-size:9px;white-space:nowrap}.pin-a{left:26%;top:30%}.pin-b{right:27%;top:48%}
.mapa-legenda{position:absolute;left:12px;right:12px;bottom:10px;padding:8px 10px;border-radius:9px;background:rgba(4,35,24,.78);display:flex;gap:16px;color:#fff;font-size:8px}.mapa-legenda span{display:flex;align-items:center;gap:5px}.mapa-legenda i{width:8px;height:8px;border-radius:3px;background:#26b765}.mapa-legenda span:nth-child(2) i{background:#e4b52f}.mapa-legenda span:nth-child(3) i{background:#2d86c5}
.anel-wrap{min-height:285px;display:flex;align-items:center;justify-content:center;gap:22px}.anel{width:145px;height:145px;border-radius:50%;display:grid;place-items:center;align-content:center;background:radial-gradient(circle at center,#fff 52%,transparent 53%),conic-gradient(#1da76c 0 48%,#2e83c4 48% 73%,#e4b52f 73% 100%)}.anel strong{font-size:26px}.anel span{font-size:9px;color:#789086}.anel-lista{min-width:120px}.anel-lista div{display:grid;grid-template-columns:12px 1fr auto;gap:7px;padding:9px 0;border-bottom:1px solid #edf2ef;font-size:9px}.ponto{width:8px;height:8px;border-radius:50%;margin-top:2px}.ponto.verde{background:#1da76c}.ponto.azul{background:#2e83c4}.ponto.ouro{background:#e4b52f}
.inteligencia{background:linear-gradient(180deg,#f8fffb,#fff)}.insight{display:flex;gap:10px;padding:12px;border:1px solid #e0e9e4;border-radius:12px;margin-bottom:9px}.insight>b{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px}.insight div{display:flex;flex-direction:column;gap:4px}.insight strong{font-size:10px}.insight span{font-size:9px;line-height:1.4;color:#71867c}.insight.bom>b{background:#e1f7eb;color:#118552}.insight.atencao>b{background:#fff3d7;color:#a87600}.insight.info>b{background:#e4f0fa;color:#287ab2}
.mini-cards{display:grid;grid-template-columns:1fr 1fr;gap:9px}.mini-cards>div{padding:14px;border:1px solid #e0e9e4;border-radius:12px;background:#f8fbf9;display:flex;flex-direction:column;gap:6px}.mini-cards small{font-size:8px;color:#658076;font-weight:900}.mini-cards strong{font-size:15px;color:#184434}.mini-cards span{font-size:8px;color:#7b9087}
.status-lista>div{display:flex;justify-content:space-between;padding:11px 2px;border-bottom:1px solid #e8efeb;font-size:10px}.status-lista span{font-weight:800}.status-lista b{color:#2a8a60;font-size:9px}
.atalhos-dash{display:grid;grid-template-columns:1fr 1fr;gap:8px}.atalhos-dash button{min-height:58px;border:1px solid #dfe9e3;border-radius:11px;background:#f8fbf9;color:#1a684a;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px}.atalhos-dash span{font-size:9px;color:#274c3e}

.pragas-acoes{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}.pragas-safra{display:flex;flex-direction:column;gap:7px;color:#fff}.pragas-safra small{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#f4c542}.pragas-safra select{min-width:150px;border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:13px 15px;background:rgba(255,255,255,.12);color:#fff;font-weight:800;outline:none}.pragas-safra select option{color:#123d34;background:#fff}.pragas-sem-dados{text-align:center;padding:52px 28px}.pragas-sem-dados .check{margin:0 auto 16px}.pragas-sem-dados>span{display:block;color:#278b61;font-size:11px;font-weight:900;letter-spacing:1.4px;margin-bottom:8px}.pragas-sem-dados h2{margin:0 0 10px;color:#123d34;font-size:30px}.pragas-sem-dados p{max-width:680px;margin:0 auto;color:#748d85;line-height:1.7}
@media(max-width:1250px){.dash-grid-principal{grid-template-columns:1fr 1fr}.inteligencia{grid-column:1/-1}.dash-grid-secundario{grid-template-columns:1fr 1fr}.dash-grid-secundario>section:last-child{grid-column:1/-1}}
@media(max-width:900px){.dash-filtros,.dash-kpis,.dash-grid-principal,.dash-grid-secundario{grid-template-columns:1fr 1fr}.dash-capa{align-items:flex-start;gap:20px;flex-direction:column}.inteligencia,.dash-grid-secundario>section:last-child{grid-column:auto}.sidebar{width:220px;min-width:220px}main{padding:20px}}
@media(max-width:700px){.dash-filtros,.dash-kpis,.dash-grid-principal,.dash-grid-secundario{grid-template-columns:1fr}.inteligencia,.dash-grid-secundario>section:last-child{grid-column:auto}.sidebar{display:none}.dash-capa h2{font-size:28px}}
/* ===== REFINO PREMIUM - PAINEL SOUZA SILVA ===== */
body{background:#061a14}
.app{background:#061a14}
.sidebar{
  width:245px;min-width:245px;
  background:linear-gradient(180deg,#041a14 0%,#073326 55%,#05251d 100%);
  border-right:1px solid rgba(86,199,143,.18);
  box-shadow:14px 0 40px rgba(0,0,0,.18)
}
.brand{
  min-height:112px!important;
  padding:14px 16px!important;
  background:#fff!important;
  border-bottom:4px solid #0b7047!important
}
.brand img{max-width:205px!important;max-height:80px!important}
.menu{padding:16px 12px}
.menu-titulo{color:#67c8a1!important;font-size:9px!important;letter-spacing:1.7px!important;margin:18px 10px 8px!important}
.menu button{
  min-height:39px!important;margin-bottom:3px!important;border-radius:9px!important;
  color:#dcece5!important;font-size:10px!important;padding:9px 12px!important;
  background:transparent!important
}
.menu button:hover{background:rgba(53,181,125,.12)!important;color:#fff!important}
.menu button.ativo{background:linear-gradient(90deg,#0d8b55,#087348)!important;color:#fff!important;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.usuario{background:#05231b!important;border-top:1px solid rgba(255,255,255,.08)!important;color:#fff!important}

main{
  padding:14px 18px 28px!important;
  background:
    radial-gradient(circle at 78% -10%,rgba(32,151,98,.13),transparent 28%),
    linear-gradient(180deg,#071d16 0%,#08251c 45%,#061a14 100%)!important;
  color:#eaf5f0
}
.topbar{
  min-height:54px!important;margin-bottom:12px!important;padding:0 4px 0 8px!important;
  background:transparent!important;color:#fff!important
}
.topbar h1{color:#fff!important;font-size:18px!important}
.topbar p{color:#88a99b!important}

.dashboard-ia{gap:10px!important}
.dash-capa{
  min-height:138px!important;padding:22px 26px!important;border-radius:16px!important;
  border:1px solid rgba(91,207,150,.20)!important;
  background:
    linear-gradient(90deg,rgba(2,27,20,.98) 0%,rgba(4,55,37,.86) 48%,rgba(6,46,32,.54) 100%),
    radial-gradient(circle at 83% 25%,rgba(255,194,56,.46),transparent 22%),
    linear-gradient(120deg,#0a3c29,#1b7650)!important;
  box-shadow:0 12px 30px rgba(0,0,0,.22)!important
}
.dash-capa h2{font-size:27px!important;margin:6px 0 4px!important}
.dash-capa p{font-size:10px!important;color:#bcd6ca!important}
.dash-capa-conteudo>span{font-size:9px!important;color:#e8bf42!important}
.dash-data{min-width:220px!important;padding:12px 15px!important;background:rgba(2,25,18,.64)!important;border-color:rgba(255,255,255,.13)!important}
.dash-data strong{font-size:12px!important}

.dash-filtros{
  padding:10px!important;gap:8px!important;border-radius:13px!important;
  border:1px solid rgba(89,190,140,.22)!important;
  background:#0a2b21!important;box-shadow:0 8px 22px rgba(0,0,0,.14)!important
}
.dash-filtros span{color:#8db4a4!important}
.dash-filtros select{
  height:36px!important;border-color:#1d5440!important;background:#071f18!important;
  color:#eef8f4!important;font-size:10px!important
}

.dash-kpis{gap:8px!important}
.dash-kpi{
  min-height:88px!important;padding:13px 14px!important;border-radius:13px!important;
  box-shadow:0 8px 20px rgba(0,0,0,.18)!important
}
.dash-kpi i{width:42px!important;height:42px!important;border-radius:11px!important;font-size:19px!important}
.dash-kpi span{font-size:9px!important}.dash-kpi strong{font-size:24px!important}.dash-kpi small{font-size:8px!important}

.dash-grid-principal{grid-template-columns:1.65fr 1.05fr .95fr!important;gap:9px!important}
.dash-grid-secundario{grid-template-columns:1.1fr 1fr .9fr!important;gap:9px!important}
.dash-card{
  border:1px solid rgba(91,184,140,.18)!important;border-radius:13px!important;
  background:linear-gradient(180deg,#0b2a21 0%,#08231b 100%)!important;
  padding:12px!important;color:#e8f4ef!important;box-shadow:0 8px 22px rgba(0,0,0,.16)!important
}
.dash-card-titulo{margin-bottom:9px!important}
.dash-card-titulo span{color:#f2f8f5!important;font-size:11px!important}
.dash-card-titulo b{color:#44cf91!important}.dash-card-titulo small{color:#72988a!important}
.dash-card-titulo button{color:#52d69a!important}

.mapa-placeholder{
  height:255px!important;border:1px solid rgba(255,255,255,.06)!important;
  background:
    linear-gradient(30deg,rgba(37,113,70,.25) 12%,transparent 12.5%,transparent 87%,rgba(37,113,70,.20) 87.5%),
    linear-gradient(150deg,rgba(198,168,59,.18) 12%,transparent 12.5%,transparent 87%,rgba(198,168,59,.16) 87.5%),
    linear-gradient(135deg,#435f49,#244a36)!important
}
.mapa-grade{opacity:.45}.mapa-legenda{background:rgba(3,24,18,.88)!important}
.anel-wrap{min-height:255px!important;gap:15px!important}
.anel{
  width:126px!important;height:126px!important;
  background:radial-gradient(circle at center,#09241c 52%,transparent 53%),conic-gradient(#1fbd76 0 48%,#328cd0 48% 73%,#e9b92e 73% 100%)!important
}
.anel strong{font-size:23px!important;color:#fff!important}.anel span{color:#87a99b!important}
.anel-lista div{border-color:rgba(255,255,255,.08)!important;color:#c9ddd4!important}

.inteligencia{background:linear-gradient(180deg,#0b3024,#08251d)!important}
.insight{padding:10px!important;margin-bottom:7px!important;border-color:rgba(255,255,255,.08)!important;background:rgba(255,255,255,.025)!important}
.insight strong{color:#fff!important;font-size:9px!important}.insight span{color:#91aa9f!important;font-size:8px!important}
.insight.bom>b{background:rgba(38,195,116,.13)!important;color:#4bdd96!important}
.insight.atencao>b{background:rgba(230,178,48,.13)!important;color:#f0c554!important}
.insight.info>b{background:rgba(55,143,207,.13)!important;color:#62b0e8!important}

.mini-cards>div{padding:11px!important;background:#09271e!important;border-color:rgba(255,255,255,.08)!important}
.mini-cards small{color:#70a18e!important}.mini-cards strong{color:#fff!important}.mini-cards span{color:#8aa99c!important}
.status-lista>div{border-color:rgba(255,255,255,.08)!important;color:#d9e9e2!important}.status-lista b{color:#54d89c!important}
.atalhos-dash button{min-height:50px!important;background:#09271e!important;border-color:rgba(255,255,255,.08)!important;color:#4bd294!important}
.atalhos-dash span{color:#dceae4!important}

@media(max-width:1250px){
  .dash-grid-principal{grid-template-columns:1fr 1fr!important}
  .inteligencia{grid-column:1/-1}
  .dash-grid-secundario{grid-template-columns:1fr 1fr!important}
  .dash-grid-secundario>section:last-child{grid-column:1/-1}
}
@media(max-width:900px){
  .sidebar{width:210px!important;min-width:210px!important}
  .dash-filtros,.dash-kpis,.dash-grid-principal,.dash-grid-secundario{grid-template-columns:1fr 1fr!important}
}
@media(max-width:700px){
  .dash-filtros,.dash-kpis,.dash-grid-principal,.dash-grid-secundario{grid-template-columns:1fr!important}
}

.mapa-real svg{position:absolute;inset:8px 8px 34px;width:calc(100% - 16px);height:calc(100% - 42px)}
.mapa-real polygon{fill:#1fa968;fill-opacity:.72;stroke:#e8fff4;stroke-width:1.5;vector-effect:non-scaling-stroke;transition:.18s}
.mapa-real polygon:hover{fill-opacity:.95;stroke:#f2c94c;stroke-width:2.5}
.mapa-sem-dados{position:absolute;inset:0 0 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#b7cec3;gap:6px;padding:20px}
.mapa-sem-dados b{font-size:30px;color:#48c88d}.mapa-sem-dados strong{font-size:12px;color:#edf7f2}.mapa-sem-dados span{font-size:9px;max-width:330px;line-height:1.5}
.mapa-legenda strong{margin-left:auto;color:#dcece5;font-size:8px}

*{box-sizing:border-box}
html,body,#root{margin:0;min-width:100%;min-height:100%}
body{background:#f2f6f3;font-family:Inter,"Segoe UI",Arial,sans-serif}
button,input,textarea{font:inherit}
button{cursor:pointer}
button:disabled{cursor:default;opacity:.55}
.app{display:flex;min-height:100vh;background:#f2f6f3;color:#153f32}

.sidebar{
width:275px;min-width:275px;height:100vh;position:sticky;top:0;
display:flex;flex-direction:column;
background:linear-gradient(180deg,#103f35,#0d523e);color:white
}
.brand{min-height:125px;padding:18px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid rgba(255,255,255,.08);background:#fff}
.brand img{max-width:225px;max-height:88px;object-fit:contain}
.brand>div{text-align:center}
.brand strong{display:block;font-size:22px;letter-spacing:.5px}
.brand strong span{color:#7ebce9}
.brand small{display:block;margin-top:9px;color:#d5e7df;font-size:9px;letter-spacing:1.5px}
.sidebar nav{flex:1;overflow:auto;padding:8px 13px 25px}
.grupo{margin:22px 12px 8px;color:#91b8aa;font-size:10px;font-weight:900;letter-spacing:1.5px}
.nav{width:100%;min-height:45px;padding:8px 13px;border:0;border-radius:10px;background:transparent;color:#e4eee9;display:flex;align-items:center;gap:11px;text-align:left;font-size:13px;font-weight:700}
.nav:hover{background:rgba(255,255,255,.07)}
.nav.ativo{background:white;color:#174c3b}
.nav i{width:24px;text-align:center;color:#9fcbbb;font-style:normal}
.usuario{padding:15px 18px;display:flex;align-items:center;gap:11px;border-top:1px solid rgba(255,255,255,.09)}
.usuario>b{width:43px;height:43px;display:grid;place-items:center;border-radius:12px;background:#efbf3f;color:#174738}
.usuario div{display:flex;flex-direction:column;gap:4px}
.usuario strong{font-size:12px}
.usuario span{font-size:10px;color:#b9d1c7}

main{flex:1;min-width:0;padding:27px 32px 45px}
header{min-height:105px;display:flex;justify-content:space-between}
.online{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#3e9569}
header h1{margin:8px 0 5px;font-size:29px}
header p{margin:0;color:#7f9187;font-size:12px}
.refresh{width:46px;height:46px;border:1px solid #dce5df;border-radius:12px;background:white;color:#267d58;font-size:19px}

.hero,.faixa,.propriedade,.agricultura-hero,.talhao-hero,.planejamento-hero{
padding:35px 40px;border-radius:22px;
background:linear-gradient(120deg,#174e3c,#398c62);color:white
}
.hero{min-height:235px}
.hero span,.faixa>span,.propriedade>div>span,.agricultura-hero>div>span,.talhao-hero>div>span,.planejamento-hero>div>span{
color:#f0c74e;font-size:9px;font-weight:900;letter-spacing:1.5px
}
.hero h2,.faixa h2,.propriedade h2,.agricultura-hero h2,.talhao-hero h2,.planejamento-hero h2{
margin:10px 0 7px;font-size:32px
}
.hero p,.faixa p,.propriedade p,.agricultura-hero p,.talhao-hero p,.planejamento-hero p{
margin:0;color:#d9e9e1;font-size:12px
}

.propriedade,.agricultura-hero,.talhao-hero,.planejamento-hero{
min-height:200px;display:flex;justify-content:space-between;align-items:center
}
.info-propriedade,.agri-selo,.etapa-atual,.planejamento-status{
width:285px;padding:20px;border:1px solid rgba(255,255,255,.15);
border-radius:15px;background:rgba(255,255,255,.1);display:flex;flex-direction:column
}
.info-propriedade small,.agri-selo small,.etapa-atual small,.planejamento-status small{
font-size:8px;color:#d0e1d9
}
.info-propriedade strong,.agri-selo strong,.etapa-atual strong,.planejamento-status strong{
margin:5px 0 12px;font-size:17px
}
.status-planejado,.etapa-atual span,.planejamento-status span{
font-size:8px;color:#ffe18a;font-weight:900
}

.kpis{margin-top:14px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.kpi{min-height:110px;padding:16px;border:1px solid #dce5df;border-radius:15px;background:white;color:#174838;display:flex;flex-direction:column;align-items:flex-start;text-align:left}
.kpi span{font-size:8px;font-weight:900;letter-spacing:1px;color:#789086}
.kpi strong{margin-top:7px;font-size:26px}
.kpi small{margin-top:5px;color:#4a906c;font-size:9px}

.painel{margin-top:14px;padding:25px;border:1px solid #dce5df;border-radius:19px;background:white}
.titulo{display:flex;justify-content:space-between;align-items:center;gap:20px}
.titulo>div>span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#3e9167}
.titulo h2{margin:6px 0 5px;font-size:21px}
.titulo p{margin:0;color:#84958c;font-size:11px}
.titulo input{width:270px;height:42px;padding:0 13px;border:1px solid #dce5df;border-radius:10px}

.grade{margin-top:20px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.card{padding:20px;border:1px solid #dfe7e2;border-radius:15px;background:#fbfcfb}
.card>span,.fazenda-body>span{color:#3e9067;font-size:8px;font-weight:900;letter-spacing:1px}
.card h3{margin:7px 0}
.card p{color:#82948a;font-size:10px}
.linha{margin-top:15px;padding:12px 0;border-top:1px solid #e5ece7;border-bottom:1px solid #e5ece7;display:flex;justify-content:space-between}
.card button,.fazenda-body>button{width:100%;margin-top:12px;padding:10px 0;border:0;background:transparent;color:#267d58;text-align:left;font-weight:850}

.voltar{margin-bottom:12px;padding:9px 12px;border:1px solid #dce5df;border-radius:9px;background:white;color:#267d58;font-weight:800}
.fazenda{overflow:hidden;border:1px solid #dfe7e2;border-radius:16px;background:#fbfcfb}
.capa{min-height:115px;padding:18px;display:flex;align-items:flex-end;justify-content:space-between;background:linear-gradient(135deg,#dcecdf,#b7d6bd);color:#287856}
.capa span{font-size:8px;font-weight:900}
.capa b{width:45px;height:45px;display:grid;place-items:center;border-radius:12px;background:white}
.fazenda-body{padding:19px}
.fazenda-body h3{margin:7px 0 15px}
.duas{padding:13px 0;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e4ebe6;border-bottom:1px solid #e4ebe6}
.duas div{display:flex;flex-direction:column;gap:5px}
.duas small{font-size:8px;color:#84968c}
.duas strong{font-size:10px}
.tags{margin-top:13px;display:flex;gap:6px}
.tags span{padding:6px 9px;border-radius:15px;background:#eaf4ed;color:#317e59;font-size:8px;font-weight:800}

.modulos{margin-top:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.modulo{min-height:145px;padding:18px;border:1px solid #dfe7e2;border-radius:14px;background:#f9fbf9;color:#174838;display:flex;gap:13px;text-align:left}
.modulo:hover{border-color:#87b99b;background:#f4f9f5}
.modulo-icone{width:42px;height:42px;min-width:42px;display:grid;place-items:center;border-radius:11px;background:#e7f2ea;color:#287e59}
.modulo>div:nth-child(2){flex:1}
.modulo h3{margin:2px 0 6px;font-size:13px}
.modulo p{margin:0;min-height:42px;color:#809188;font-size:9px;line-height:1.5}
.modulo span{display:block;margin-top:8px;color:#3a8b63;font-size:9px;font-weight:850}

.botao-verde{padding:11px 16px;border:0;border-radius:10px;background:#267d58;color:white;font-weight:800}
.botao-secundario{padding:11px 16px;border:1px solid #d5e1d9;border-radius:10px;background:white;color:#43685a;font-weight:800}

.tabela-wrap{margin-top:22px;overflow:auto;border:1px solid #e1e8e3;border-radius:13px}
table{width:100%;border-collapse:collapse}
th{padding:13px;text-align:left;background:#f1f6f2;color:#70867b;font-size:8px;letter-spacing:.8px}
td{padding:14px 13px;border-top:1px solid #e6ece8;font-size:10px}
td strong{font-size:11px}
.linha-talhao{transition:.15s;cursor:pointer}
.linha-talhao:hover{background:#f4f9f5}
.abrir{color:#29815a;font-weight:900}
.chip-planejado{padding:6px 9px;border-radius:12px;background:#fff5d8;color:#9a7413;font-size:8px;font-weight:900}
.chip-plantado{padding:6px 9px;border-radius:12px;background:#e6f4e9;color:#2c8559;font-size:8px;font-weight:900}

.fluxo{margin-top:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.etapa{padding:17px;border:1px solid #dce5df;border-radius:14px;background:white;display:flex;align-items:center;gap:12px}
.etapa>b{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#edf3ef;color:#71877c}
.etapa div{display:flex;flex-direction:column;gap:3px}
.etapa small{font-size:7px;color:#84968c;font-weight:900}
.etapa strong{font-size:10px}
.etapa-ativa{border-color:#e7c65b;background:#fffaf0}
.etapa-ativa>b{background:#f3c94d;color:#194738}
.etapa-concluida>b{background:#dff1e4;color:#2c8559}

.dados-grid{margin-top:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.campo{padding:17px;border-radius:12px;background:#f4f7f5;display:flex;flex-direction:column;gap:7px}
.campo small{font-size:8px;color:#84968c;font-weight:900;letter-spacing:.7px}
.campo strong{font-size:13px}

.talhao-modulos{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.card-talhao{padding:20px;border:1px solid #dce5df;border-radius:16px;background:white}
.card-destaque{border-color:#b8d8c3;box-shadow:0 8px 24px rgba(30,91,64,.07)}
.card-talhao>span{font-size:8px;color:#3d9067;font-weight:900;letter-spacing:1px}
.numero-talhao{margin-top:13px;display:flex;align-items:baseline;gap:7px}
.numero-talhao strong{font-size:28px}
.numero-talhao small{color:#84968c;font-size:9px}
.card-talhao p{min-height:38px;color:#82948a;font-size:10px;line-height:1.5}
.card-talhao button{padding:0;border:0;background:transparent;color:#287f59;font-size:10px;font-weight:900}

.aviso-planejamento{margin-top:14px;padding:22px;border:1px solid #ead79d;border-radius:16px;background:#fffaf0;display:flex;gap:16px;align-items:center}
.aviso-icone{width:48px;height:48px;min-width:48px;display:grid;place-items:center;border-radius:13px;background:#f2c94c;color:#174838;font-size:20px}
.aviso-planejamento span{font-size:8px;color:#947114;font-weight:900;letter-spacing:1px}
.aviso-planejamento h3{margin:5px 0}
.aviso-planejamento p{margin:0;color:#7c7768;font-size:10px;line-height:1.5}

.formulario{padding:30px}
.form-grid{margin-top:25px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.campo-form{display:flex;flex-direction:column;gap:7px}
.campo-form span,.campo-textarea>span{font-size:9px;font-weight:900;color:#587467;letter-spacing:.4px}
.campo-form input,.campo-form select,.campo-textarea textarea{
width:100%;border:1px solid #d7e2db;border-radius:10px;background:#fbfcfb;color:#153f32;outline:none
}
.campo-form input,.campo-form select{height:44px;padding:0 12px}
.campo-textarea{margin-top:16px;display:flex;flex-direction:column;gap:7px}
.campo-textarea textarea{padding:12px;resize:vertical}
.campo-form input:focus,.campo-textarea textarea:focus{border-color:#69a982;box-shadow:0 0 0 3px rgba(73,145,102,.08)}

.alerta-form{margin-top:20px;padding:18px;border:1px solid #ead79d;border-radius:13px;background:#fffaf0;display:flex;gap:13px}
.alerta-form>b{width:40px;height:40px;min-width:40px;display:grid;place-items:center;border-radius:10px;background:#f1ca51}
.alerta-form strong{font-size:11px}
.alerta-form p{margin:5px 0 0;color:#7f7969;font-size:10px;line-height:1.5}
.acoes-form{margin-top:22px;display:flex;justify-content:flex-end;gap:10px}

.erro-box{margin-top:18px;padding:13px 15px;border:1px solid #e7b8b8;border-radius:10px;background:#fff2f2;color:#a94343;font-size:11px;font-weight:700}
.sucesso-box{margin-bottom:12px;padding:13px 15px;border:1px solid #b9dec5;border-radius:10px;background:#edf8f0;color:#287d51;font-size:11px;font-weight:800}

.vazio,.mensagem{min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.vazio p{color:#82948a;font-size:11px}
.check{width:50px;height:50px;display:grid;place-items:center;border-radius:13px;background:#e7f3ea;color:#287e59}
.spinner{width:30px;height:30px;margin-bottom:12px;border:3px solid #dce9e0;border-top-color:#2c855e;border-radius:50%;animation:girar .8s linear infinite}
@keyframes girar{to{transform:rotate(360deg)}}


.dashboard-producao{position:relative}
.producao-hero{
margin-bottom:14px;padding:26px 30px;border-radius:22px;
background:linear-gradient(120deg,#0e3c34 0%,#176046 52%,#3a8e63 100%);color:white;
display:flex;align-items:center;justify-content:space-between;gap:25px;
box-shadow:0 14px 35px rgba(18,67,49,.13)
}
.producao-identidade{display:flex;align-items:center;gap:18px}
.producao-identidade img{width:82px;max-height:68px;object-fit:contain;background:rgba(255,255,255,.96);padding:7px;border-radius:13px}
.producao-hero>div:first-child>span{color:#f0c74e;font-size:9px;font-weight:900;letter-spacing:1.5px}
.producao-hero h2{margin:9px 0 6px;font-size:31px}
.producao-hero p{margin:0;color:#d8e9e1;font-size:11px}
.dash-filtros{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.dash-filtros label{display:flex;flex-direction:column;gap:6px}
.dash-filtros small{font-size:8px;color:#cfe3da;font-weight:900}
.dash-filtros select{height:39px;min-width:150px;padding:0 10px;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:white;color:#174838}
.dash-atualizar,.dash-apresentar,.dash-whatsapp{height:39px;padding:0 13px;border:0;border-radius:9px;font-weight:900}
.dash-atualizar{background:#f0c74e;color:#174838}
.dash-apresentar{background:white;color:#174838}
.dash-whatsapp{background:#dff3e6;color:#17603f}
.producao-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.producao-kpis article{min-height:125px;padding:19px;border:1px solid #dce5df;border-radius:17px;background:linear-gradient(180deg,#ffffff,#f8fbf9);display:flex;flex-direction:column;box-shadow:0 8px 22px rgba(20,70,50,.05)}
.producao-kpis span{font-size:8px;font-weight:900;letter-spacing:1px;color:#789086}
.producao-kpis strong{margin-top:9px;font-size:23px;color:#174838}
.producao-kpis small{margin-top:6px;color:#4a906c;font-size:9px}
.dash-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}
.dash-card{min-width:0}
.barras{margin-top:22px;display:flex;flex-direction:column;gap:13px}
.barra-topo{display:flex;justify-content:space-between;gap:15px;font-size:10px}
.barra-topo span{font-weight:900;color:#267d58}
.barra-trilho{height:8px;margin:6px 0;background:#edf2ee;border-radius:999px;overflow:hidden}
.barra-trilho div{height:100%;background:linear-gradient(90deg,#267d58,#67aa7e);border-radius:999px}
.barra-item small{color:#82948a;font-size:8px}
.meses{height:330px;margin-top:25px;display:flex;align-items:flex-end;gap:8px;overflow-x:auto;padding-bottom:5px}
.mes-coluna{height:100%;min-width:62px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}
.mes-valor{font-size:8px;font-weight:900;color:#267d58;white-space:nowrap}
.mes-barra-box{height:220px;width:34px;background:#edf2ee;border-radius:8px;display:flex;align-items:flex-end;overflow:hidden}
.mes-barra-box div{width:100%;background:linear-gradient(180deg,#67aa7e,#267d58);border-radius:8px 8px 0 0}
.mes-coluna strong{font-size:9px}
.mes-coluna small{font-size:8px;color:#82948a}

@media(max-width:1250px){
.kpis{grid-template-columns:repeat(3,1fr)}
.talhao-modulos{grid-template-columns:repeat(2,1fr)}
.form-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:950px){
.sidebar{width:215px;min-width:215px}
main{padding:20px}
.grade,.modulos,.talhao-modulos,.dados-grid,.fluxo,.form-grid{grid-template-columns:1fr}
.propriedade,.agricultura-hero,.talhao-hero,.planejamento-hero{flex-direction:column;align-items:flex-start;gap:20px}
.info-propriedade,.agri-selo,.etapa-atual,.planejamento-status{width:100%}
}




.metrica-verde .metrica-trilho div{background:linear-gradient(90deg,#176a48,#62a978)}
.metrica-azul .metrica-trilho div{background:linear-gradient(90deg,#246e9b,#6eadd0)}
.metrica-dourado .metrica-trilho div{background:linear-gradient(90deg,#b48616,#e5c458)}
.metrica-turquesa .metrica-trilho div{background:linear-gradient(90deg,#147b75,#62b6a8)}
.metrica-verde .metrica-topo b{color:#176a48}
.metrica-azul .metrica-topo b{color:#246e9b}
.metrica-dourado .metrica-topo b{color:#9b7312}
.metrica-turquesa .metrica-topo b{color:#147b75}




.metrica-colunas-wrap{position:relative}
.media-badge{position:absolute;right:4px;top:0;padding:6px 9px;border-radius:999px;background:#e7f1f7;color:#246e9b;font-size:8px;font-weight:900}
.lollipop-lista{margin-top:20px;display:flex;flex-direction:column;gap:13px}
.lollipop-topo{display:flex;justify-content:space-between;gap:10px}
.lollipop-topo strong{font-size:9px;color:#173f33}
.lollipop-topo b{font-size:10px;color:#9b7312}
.lollipop-linha{height:10px;position:relative;background:#f2eee2;border-radius:999px;margin-top:5px}
.lollipop-linha>div{height:3px;position:absolute;left:0;top:3.5px;background:#c49a27;border-radius:999px}
.lollipop-linha>i{position:absolute;top:-2px;width:14px;height:14px;border-radius:50%;background:#d7ae37;border:3px solid #fff;box-shadow:0 1px 5px rgba(105,78,8,.25)}
.referencia-texto{margin-top:3px;text-align:right;color:#9b7312;font-size:8px;font-weight:900}

.metrica-colunas{height:315px;margin-top:20px;display:flex;align-items:flex-end;gap:10px;padding:8px 2px 0;overflow:hidden}
.coluna-item{height:100%;flex:1;min-width:48px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px}
.coluna-item>b{font-size:9px;white-space:nowrap}
.coluna-trilho{height:220px;width:70%;max-width:48px;min-width:24px;border-radius:12px;background:#edf2ee;overflow:hidden;display:flex;align-items:flex-end}
.coluna-trilho>div{width:100%;border-radius:12px 12px 0 0}
.coluna-item>strong{font-size:9px;color:#173f33}
.coluna-item>small{max-width:78px;height:24px;text-align:center;overflow:hidden;font-size:7px;line-height:1.2;color:#789086}
.metrica-azul .coluna-trilho>div{background:linear-gradient(180deg,#74b4d5,#246e9b)}
.metrica-turquesa .coluna-trilho>div{background:linear-gradient(180deg,#70c1b4,#147b75)}

@media print{
@page{size:A4 landscape;margin:7mm}
html,body,#root{background:#eef4f0!important}
body *{visibility:hidden!important}
.dashboard-producao,.dashboard-producao *{visibility:visible!important}
.dashboard-producao{
position:absolute!important;left:0!important;top:0!important;width:100%!important;
padding:10px!important;background:#eef4f0!important;overflow:visible!important
}
.dashboard-producao .dash-filtros,.dashboard-producao .mensal-pendente{display:none!important}
.dashboard-producao .producao-hero{padding:18px 22px!important;margin-bottom:9px!important}
.dashboard-producao .producao-hero h2{font-size:25px!important}
.dashboard-producao .producao-kpis{grid-template-columns:repeat(5,1fr)!important;gap:7px!important}
.dashboard-producao .producao-kpis article{min-height:90px!important;padding:12px!important}
.dashboard-producao .producao-kpis strong{font-size:18px!important}
.dashboard-producao .metricas-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
.dashboard-producao .metrica-card{padding:14px!important;margin-top:8px!important;break-inside:avoid}
.dashboard-producao .metrica-card .titulo h2{font-size:15px!important}
.dashboard-producao .metrica-card .titulo p{font-size:8px!important}
.dashboard-producao .metrica-barras{margin-top:10px!important;gap:6px!important}
.dashboard-producao .metrica-topo strong{font-size:7px!important}
.dashboard-producao .metrica-topo b{font-size:8px!important}
.dashboard-producao .metrica-trilho{height:6px!important;margin-top:3px!important}
.dashboard-producao .metrica-colunas{height:205px!important;margin-top:8px!important;gap:6px!important}
.dashboard-producao .coluna-trilho{height:145px!important;max-width:34px!important}
.dashboard-producao .coluna-item>b{font-size:7px!important}
.dashboard-producao .coluna-item>small{font-size:6px!important}
}


/* Regra executiva: nenhum gráfico omite fazendas/glebas */
.metrica-card{min-height:430px}
.metrica-colunas-wrap{width:100%;overflow-x:auto;padding-bottom:4px}
.metrica-colunas{height:340px;min-width:max-content}
.metrica-colunas .coluna-item{flex:0 0 64px}
.lollipop-lista,.metrica-barras{overflow:visible}
@media (min-width:1400px){
  .metrica-colunas .coluna-item{flex-basis:70px}
}

.metricas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.metrica-card{min-width:0;box-shadow:0 8px 25px rgba(20,70,50,.05)}
.metrica-card .titulo h2{color:#174838!important;font-size:20px}
.metrica-card .titulo p{color:#7b9085}
.metrica-barras{margin-top:20px;display:flex;flex-direction:column;gap:12px}
.metrica-item{min-width:0}
.metrica-topo{display:flex;justify-content:space-between;gap:12px;align-items:center}
.metrica-topo strong{font-size:9px;color:#173f33;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.metrica-topo b{font-size:10px;color:#217a54;white-space:nowrap}
.metrica-trilho{height:9px;margin-top:6px;background:#edf2ee;border-radius:999px;overflow:hidden}
.metrica-trilho div{height:100%;border-radius:999px;background:linear-gradient(90deg,#1e7b55,#69ad7f)}
.mensal-pendente .titulo h2{color:#174838!important}
.mensal-aviso{margin-top:18px;padding:20px;border:1px dashed #cbd9d0;border-radius:14px;background:#f7faf8;display:flex;flex-direction:column;gap:5px;text-align:center}
.mensal-aviso strong{color:#174838;font-size:12px}
.mensal-aviso span{color:#7b9085;font-size:10px}

.dashboard-producao.apresentacao{
position:fixed;inset:0;z-index:9999;overflow:auto;background:#eef4f0;
padding:22px 28px 35px
}
.dashboard-producao.apresentacao .producao-hero{border-radius:18px}
.dashboard-producao.apresentacao .producao-kpis{grid-template-columns:repeat(5,minmax(0,1fr))}
.dashboard-producao.apresentacao .metricas-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.dashboard-producao.apresentacao .metrica-card{margin-top:14px}
.dashboard-producao.apresentacao .barras{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px}
.dashboard-producao.apresentacao .painel{box-shadow:0 8px 25px rgba(20,70,50,.05)}

@media(max-width:1250px){
.producao-kpis{grid-template-columns:repeat(3,1fr)}
.dash-grid{grid-template-columns:1fr}
}
@media(max-width:950px){
.metricas-grid,.dashboard-producao.apresentacao .metricas-grid{grid-template-columns:1fr}
.producao-hero{flex-direction:column;align-items:flex-start}
.dash-filtros{justify-content:flex-start}
.producao-kpis{grid-template-columns:1fr}
}

.mapa-fazenda-card{margin-top:14px;padding:20px}
.mapa-fazenda-titulo{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
.mapa-status{font-size:9px;font-weight:900;letter-spacing:.8px;color:#1f8056;background:#e9f6ee;border:1px solid #c9e8d4;border-radius:999px;padding:8px 12px;white-space:nowrap}
.mapa-fazenda-grid{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(220px,.9fr);gap:16px;margin-top:16px}
.mapa-canvas{position:relative;min-height:430px;border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 45%,#f8fbf9,#e9f1ec);border:1px solid #dce8e1}
.mapa-canvas:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(23,96,68,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(23,96,68,.045) 1px,transparent 1px);background-size:28px 28px}
.mapa-canvas svg{position:relative;z-index:1;width:100%;height:430px;display:block;padding:14px;box-sizing:border-box}
.mapa-canvas polygon{transition:opacity .2s,filter .2s;cursor:pointer;filter:drop-shadow(0 5px 7px rgba(17,74,51,.16))}
.mapa-canvas polygon:hover{fill-opacity:.96;filter:drop-shadow(0 7px 9px rgba(17,74,51,.28))}
.mapa-legenda{position:absolute;z-index:2;left:14px;right:14px;bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.91);backdrop-filter:blur(8px);font-size:9px;color:#557064}
.mapa-legenda span{display:flex;align-items:center;gap:7px}
.mapa-legenda i{width:10px;height:10px;border-radius:3px;background:#2b8159}
.mapa-legenda strong{color:#174838}
.mapa-resumo{display:grid;grid-template-columns:1fr;gap:9px}
.mapa-resumo>div{display:flex;flex-direction:column;justify-content:center;min-height:60px;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#f8fbf9,#edf5f0);border:1px solid #dce8e1}
.mapa-resumo span{font-size:8px;font-weight:800;letter-spacing:.7px;color:#799087}
.mapa-resumo strong{margin-top:3px;font-size:18px;color:#174838}
@media(max-width:950px){.mapa-fazenda-grid{grid-template-columns:1fr}.mapa-resumo{grid-template-columns:repeat(2,1fr)}}



/* ===== PRODUCAO EXECUTIVA V4 — isolado, sem alterar os demais modulos ===== */
.dashboard-producao{background:#f4f7f5;border-radius:18px;padding:14px}
.dashboard-producao .producao-hero-v4{display:grid!important;grid-template-columns:minmax(430px,1fr) auto!important;align-items:center!important;gap:18px!important;min-height:96px!important;padding:14px 18px!important;border-radius:18px!important;background:linear-gradient(115deg,#123f31 0%,#1c6548 62%,#2b7c55 100%)!important;overflow:hidden!important;box-shadow:0 14px 34px rgba(16,61,45,.16)!important}
.dashboard-producao .producao-identidade-v4{display:flex!important;align-items:center!important;gap:18px!important;min-width:0!important}
.dashboard-producao .marca-v4{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding-right:16px;border-right:1px solid rgba(255,255,255,.22)}
.dashboard-producao .marca-v4>img{width:62px!important;height:62px!important;object-fit:contain!important;background:#fff!important;border-radius:12px!important;padding:5px!important;display:block!important}
.dashboard-producao .sc-marca-v4{height:62px;min-width:112px;padding:7px 9px;box-sizing:border-box;border-radius:12px;background:#fff;display:flex;align-items:center;gap:8px;color:#164c35}
.dashboard-producao .sc-marca-v4 b{font-size:24px;line-height:1;font-weight:950;letter-spacing:-2px}.dashboard-producao .sc-marca-v4 span{font-size:6px;line-height:1.35;font-weight:800;letter-spacing:.7px}.dashboard-producao .sc-marca-v4 strong{font-size:7px}
.dashboard-producao .titulo-v4{min-width:0}.dashboard-producao .titulo-v4>span{font-size:8px!important;letter-spacing:1.25px!important;color:#bfe0cf!important;font-weight:900!important}.dashboard-producao .titulo-v4 h2{font-size:24px!important;line-height:1.08!important;margin:4px 0!important;color:white!important;white-space:nowrap!important}.dashboard-producao .titulo-v4 p{font-size:10px!important;margin:0!important;color:#e2f0e8!important;font-weight:700!important}.dashboard-producao .titulo-v4 i{font-style:normal;color:#e0b73e;padding:0 4px}
.dashboard-producao .dash-filtros-v4{display:grid!important;grid-template-columns:150px 190px 90px!important;gap:7px!important;align-items:end!important;justify-content:end!important;max-width:460px!important}.dashboard-producao .dash-filtros-v4 label{min-width:0!important}.dashboard-producao .dash-filtros-v4 label small{color:#d7eadf!important;font-size:7px!important;letter-spacing:.8px!important}.dashboard-producao .dash-filtros-v4 select{width:100%!important;height:32px!important;padding:0 9px!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:9px!important;background:rgba(255,255,255,.96)!important;color:#173f32!important;font-size:9px!important}.dashboard-producao .dash-filtros-v4 button{height:30px!important;padding:0 10px!important;border-radius:9px!important;font-size:8px!important;white-space:nowrap!important}.dashboard-producao .dash-filtros-v4 .dash-atualizar{grid-column:1}.dashboard-producao .dash-filtros-v4 .dash-whatsapp{grid-column:2}.dashboard-producao .dash-filtros-v4 .dash-apresentar{grid-column:3}
.dashboard-producao .faixa-executiva-v4{margin-top:12px;padding:0 4px 7px;display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #dfe8e2}.dashboard-producao .faixa-executiva-v4 div{display:flex;align-items:baseline;gap:9px}.dashboard-producao .faixa-executiva-v4 span{font-size:7px;font-weight:950;letter-spacing:1px;color:#2b805b}.dashboard-producao .faixa-executiva-v4 strong{font-size:13px;color:#173f32}.dashboard-producao .faixa-executiva-v4 small{font-size:8px;color:#7a8f84}
.dashboard-producao .producao-kpis-v4{display:grid!important;grid-template-columns:1.35fr 1fr .8fr .9fr .8fr!important;gap:10px!important;margin-top:10px!important}.dashboard-producao .producao-kpis-v4 article{min-height:86px!important;padding:13px 15px!important;border-radius:15px!important;background:#fff!important;border:1px solid #e1e9e4!important;box-shadow:0 5px 16px rgba(20,68,49,.055)!important}.dashboard-producao .producao-kpis-v4 article:first-child{background:linear-gradient(135deg,#f0f8f3,#fff)!important;border-left:4px solid #2a865e!important}.dashboard-producao .producao-kpis-v4 span{font-size:7px!important;letter-spacing:.85px!important;color:#70857a!important}.dashboard-producao .producao-kpis-v4 strong{font-size:23px!important;line-height:1.05!important;margin-top:7px!important;color:#183f33!important}.dashboard-producao .producao-kpis-v4 small{font-size:8px!important;color:#91a198!important;margin-top:4px!important}
.dashboard-producao .mapa-fazenda-card{border-radius:18px!important;border:1px solid #dfe8e2!important;box-shadow:0 8px 24px rgba(20,68,49,.055)!important}.dashboard-producao .mapa-canvas{min-height:360px!important}.dashboard-producao .mapa-canvas svg{height:360px!important}
.dashboard-producao .metricas-grid{display:grid!important;grid-template-columns:1.25fr .75fr!important;gap:12px!important}.dashboard-producao .metrica-card{min-height:340px!important;border-radius:18px!important;border:1px solid #e0e8e3!important;box-shadow:0 7px 20px rgba(20,68,49,.05)!important}.dashboard-producao .metrica-card:nth-child(3){grid-column:1}.dashboard-producao .metrica-card:nth-child(4){grid-column:2}
.dashboard-producao .mensal-pendente,.dashboard-producao .painel{border-radius:18px!important;border:1px solid #e0e8e3!important;box-shadow:0 7px 20px rgba(20,68,49,.05)!important}
@media(max-width:1180px){.dashboard-producao .producao-hero-v4{grid-template-columns:1fr!important}.dashboard-producao .dash-filtros-v4{justify-content:start!important;max-width:none!important}.dashboard-producao .producao-kpis-v4{grid-template-columns:repeat(3,1fr)!important}.dashboard-producao .metricas-grid{grid-template-columns:1fr!important}.dashboard-producao .metrica-card:nth-child(3),.dashboard-producao .metrica-card:nth-child(4){grid-column:auto!important}}

.pragas-hero{padding:32px 36px;border-radius:24px;background:linear-gradient(135deg,#145443,#3a9165);color:white;display:flex;align-items:center;justify-content:space-between;gap:25px;margin-bottom:18px}
.pragas-hero span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#f2c94c}.pragas-hero h2{margin:10px 0 7px;font-size:30px}.pragas-hero p{margin:0;color:#dcebe4;font-size:12px}.pragas-atualizar{padding:11px 15px;border:1px solid rgba(255,255,255,.35);border-radius:11px;background:rgba(255,255,255,.12);color:white;font-weight:800}
.pragas-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.praga-kpi{padding:18px;border:1px solid #dfe8e2;border-radius:16px;background:white;display:flex;flex-direction:column;gap:6px}.praga-kpi span{font-size:8px;font-weight:900;letter-spacing:1px;color:#71877c}.praga-kpi strong{font-size:27px;color:#174c3b}.praga-kpi small{font-size:9px;color:#87988f}.praga-kpi .praga-bom{color:#27815b}
.pragas-duas-colunas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.praga-bloco{margin-top:0}.praga-metricas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:18px}.praga-metricas div{padding:14px;border-radius:12px;background:#f2f7f3;border:1px solid #e2eae5;display:flex;flex-direction:column;gap:5px}.praga-metricas small{font-size:8px;color:#71877c;font-weight:850}.praga-metricas b{font-size:19px;color:#174c3b}.praga-lista{margin-top:16px;border-top:1px solid #e4ebe6}.praga-lista>div{padding:11px 2px;border-bottom:1px solid #edf1ee;display:flex;justify-content:space-between;gap:12px;font-size:10px}.praga-lista strong{color:#267d58}
@media(max-width:1000px){.pragas-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pragas-duas-colunas{grid-template-columns:1fr}.pragas-hero{align-items:flex-start;flex-direction:column}}


/* Refinamento visual do histórico fitossanitário */
.pragas-historico>.titulo h2{color:#174838!important;opacity:1!important}
.pragas-historico>.titulo p{color:#70877b!important}
.pragas-historico>.titulo>div>span{color:#23855c!important}
.historico-card{box-shadow:0 10px 28px rgba(24,72,56,.045)}
.hist-trilho{height:11px}

/* Dashboard Fitossanitário IA */
.pragas-historico{margin-top:14px}
.historico-selo{padding:9px 12px;border-radius:999px;background:#edf7f1;color:#247452;font-size:8px;font-weight:900;letter-spacing:1px;border:1px solid #d8e9df}
.historico-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}
.historico-card{border:1px solid #e0e9e3;border-radius:16px;padding:17px;background:linear-gradient(180deg,#fff,#f8fbf9)}
.historico-cabecalho{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px}
.historico-cabecalho div{display:flex;flex-direction:column;gap:4px}.historico-cabecalho small{font-size:8px;letter-spacing:1px;color:#6f8479;font-weight:900}.historico-cabecalho strong{font-size:17px;color:#174838}.historico-cabecalho>b{font-size:8px;color:#287a58;background:#edf7f1;padding:7px 9px;border-radius:999px}
.historico-barras{display:flex;flex-direction:column;gap:11px}.hist-linha{display:grid;grid-template-columns:38px 1fr 70px;align-items:center;gap:9px}.hist-linha>span{font-size:9px;font-weight:900;color:#526b5f}.hist-linha>strong{font-size:9px;text-align:right;color:#1f7251}.hist-trilho{height:10px;border-radius:999px;background:#eaf0ec;overflow:hidden}.hist-trilho>div{height:100%;border-radius:999px;background:linear-gradient(90deg,#1e7653,#71b28a)}.hist-sem-dado .hist-trilho{background:repeating-linear-gradient(135deg,#f1f4f2,#f1f4f2 5px,#e5ebe7 5px,#e5ebe7 10px)}.hist-sem-dado>strong{color:#8a9a91;font-size:8px}
.pragas-inteligencia{margin-top:14px;display:flex;gap:16px;align-items:flex-start;background:linear-gradient(135deg,#123f32,#1f6d50);border:none;color:white}.ia-icone{width:42px;height:42px;flex:0 0 42px;border-radius:13px;background:rgba(255,255,255,.13);display:grid;place-items:center;font-size:20px}.ia-conteudo{flex:1}.ia-conteudo>span{font-size:8px;font-weight:900;letter-spacing:1.2px;color:#b9ddcb}.ia-conteudo>h2{font-size:20px;margin:5px 0 14px;color:white}.ia-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ia-grid>div{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:14px}.ia-grid small{display:block;font-size:8px;font-weight:900;letter-spacing:1px;color:#b9ddcb;margin-bottom:6px}.ia-grid strong{display:block;font-size:12px;line-height:1.45;color:white}.ia-grid p{font-size:9px;line-height:1.5;color:#d9ebe2;margin:7px 0 0}
.ranking-titulo{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:17px}.ranking-titulo span{font-size:8px;font-weight:900;letter-spacing:1px;color:#48685a}.ranking-titulo small{font-size:8px;color:#8a9a91}
@media(max-width:1000px){.historico-grid,.ia-grid{grid-template-columns:1fr}.pragas-inteligencia{flex-direction:column}}


/* Relatórios Fitossanitários — histórico por propriedade */
.relatorio-fito{margin-top:0;margin-bottom:18px;padding:24px}
.relatorio-fito-topo{align-items:flex-start}.relatorio-selo{padding:8px 11px;border-radius:999px;background:#edf7f1;border:1px solid #d8e9df;color:#247452;font-size:8px;font-weight:900;letter-spacing:1px;white-space:nowrap}
.relatorio-filtros{display:grid;grid-template-columns:1fr 1.7fr 1fr 1fr auto;gap:10px;align-items:end;margin-top:20px;padding:14px;border:1px solid #e0e9e3;border-radius:14px;background:#f8fbf9}.relatorio-filtros label{display:flex;flex-direction:column;gap:6px}.relatorio-filtros small{font-size:8px;font-weight:900;letter-spacing:.8px;color:#6f8479}.relatorio-filtros select{height:40px;width:100%;padding:0 10px;border:1px solid #d7e2db;border-radius:10px;background:white;color:#174838;font-weight:750;outline:none}.relatorio-filtros button{height:40px;white-space:nowrap}
.relatorio-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:12px}.relatorio-kpis>div{min-height:102px;padding:14px;border:1px solid #e0e8e3;border-radius:14px;background:linear-gradient(180deg,#fff,#f8fbf9);display:flex;flex-direction:column}.relatorio-kpis small{font-size:7px;font-weight:900;letter-spacing:.8px;color:#71877c}.relatorio-kpis strong{margin-top:7px;font-size:21px;color:#174838}.relatorio-kpis span{margin-top:5px;font-size:8px;color:#87988f}
.relatorio-grafico{margin-top:12px;padding:17px;border:1px solid #e0e9e3;border-radius:15px;background:white}.relatorio-grafico-cabecalho{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:16px}.relatorio-grafico-cabecalho>div{display:flex;flex-direction:column;gap:4px}.relatorio-grafico-cabecalho small{font-size:8px;font-weight:900;letter-spacing:1px;color:#6f8479}.relatorio-grafico-cabecalho strong{font-size:16px;color:#174838}.relatorio-grafico-cabecalho>span{font-size:9px;color:#587467;font-weight:800}.relatorio-serie{display:flex;flex-direction:column;gap:10px}.relatorio-linha{display:grid;grid-template-columns:82px 1fr 120px;align-items:center;gap:10px}.relatorio-linha>b{font-size:9px;color:#526b5f}.relatorio-linha>strong{text-align:right;font-size:9px;color:#1f7251}.relatorio-trilho{height:10px;border-radius:999px;background:#eaf0ec;overflow:hidden}.relatorio-trilho i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#1e7653,#71b28a)}.relatorio-linha.sem-levantamento .relatorio-trilho{background:repeating-linear-gradient(135deg,#f1f4f2,#f1f4f2 5px,#e5ebe7 5px,#e5ebe7 10px)}.relatorio-linha.sem-levantamento>strong{color:#8a9a91;font-size:8px}.relatorio-tabela{margin-top:12px}.relatorio-vazio{text-align:center;color:#87988f;padding:24px!important}
@media(max-width:1200px){.relatorio-filtros{grid-template-columns:repeat(2,1fr)}.relatorio-filtros button{width:100%}.relatorio-kpis{grid-template-columns:repeat(3,1fr)}}
@media(max-width:760px){.relatorio-filtros,.relatorio-kpis{grid-template-columns:1fr}.relatorio-linha{grid-template-columns:72px 1fr 95px}.relatorio-grafico-cabecalho{flex-direction:column}.relatorio-selo{display:none}}


/* DASHBOARD AVANÇADO DE PRAGAS */
.pragas-avancado{margin:0 0 18px;padding:24px;background:linear-gradient(180deg,#fbfdfc,#f5faf7);border:1px solid #dce8e1;box-shadow:0 10px 30px rgba(20,68,49,.06)}
.pragas-avancado-topo{align-items:flex-start}.dash-avancado-selo{padding:8px 11px;border-radius:999px;background:#173f34;color:#fff;font-size:8px;font-weight:900;letter-spacing:1px;white-space:nowrap}
.dash-avancado-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}
.dash-avancado-kpis article{min-height:112px;padding:16px;border-radius:17px;background:#fff;border:1px solid #dfe9e3;box-shadow:0 7px 20px rgba(20,68,49,.045)}
.dash-avancado-kpis small{display:block;font-size:8px;font-weight:900;letter-spacing:1px;color:#73877c}
.dash-avancado-kpis strong{display:block;margin:10px 0 7px;font-size:25px;line-height:1.05;color:#173f34}
.dash-avancado-kpis span{font-size:9px;color:#8a9b92}.dash-avancado-kpis .prioridade-nome{font-size:14px;line-height:1.25}
.tendencia-boa{color:#247452!important;font-weight:900}.tendencia-alerta{color:#b35a35!important;font-weight:900}
.dash-avancado-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dash-chart-card,.dash-ranking-card{background:#fff;border:1px solid #dfe8e2;border-radius:18px;padding:17px;min-height:290px;box-shadow:0 7px 20px rgba(20,68,49,.045)}
.dash-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.dash-card-head small{display:block;font-size:8px;font-weight:900;letter-spacing:1px;color:#7b8d84}.dash-card-head strong{display:block;margin-top:4px;font-size:15px;color:#183f33}.dash-card-head>span{font-size:8px;font-weight:800;color:#91a198}
.dash-colunas{height:215px;display:flex;align-items:stretch;gap:9px;padding-top:12px}.dash-coluna-item{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center}.dash-coluna-item>b{height:24px;font-size:9px;color:#375b4e}.dash-coluna-trilho{height:145px;width:100%;max-width:46px;border-radius:10px 10px 4px 4px;background:#edf3ef;display:flex;align-items:flex-end;overflow:hidden}.dash-coluna-trilho i{display:block;width:100%;background:linear-gradient(180deg,#49a879,#1f6d50);border-radius:9px 9px 3px 3px}.dash-coluna-item>span{margin-top:7px;font-size:9px;font-weight:900;color:#526a60}.dash-coluna-item em{font-size:7px;color:#9aa9a1;font-style:normal;text-align:center;margin-top:3px}.dash-coluna-item.sem-dado .dash-coluna-trilho{background:repeating-linear-gradient(135deg,#f3f5f4,#f3f5f4 5px,#e8ece9 5px,#e8ece9 10px)}
.dash-ranking-lista{display:flex;flex-direction:column;gap:12px}.dash-rank-row{display:grid;grid-template-columns:28px minmax(130px,1.3fr) minmax(100px,1fr) 55px;align-items:center;gap:9px}.dash-rank-row>b{width:26px;height:26px;border-radius:8px;background:#edf7f1;display:grid;place-items:center;font-size:9px;color:#247452}.dash-rank-row>span{font-size:9px;font-weight:800;color:#34584a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dash-rank-row>div{height:7px;border-radius:99px;background:#edf2ef;overflow:hidden}.dash-rank-row>div i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#2b805c,#61b889)}.dash-rank-row>strong{text-align:right;font-size:10px;color:#173f34}.dash-sem-ranking{font-size:10px;color:#87998f}
@media(max-width:1100px){.dash-avancado-kpis{grid-template-columns:repeat(2,1fr)}.dash-avancado-grid{grid-template-columns:1fr}}
@media(max-width:700px){.dash-avancado-kpis{grid-template-columns:1fr}.dash-rank-row{grid-template-columns:28px 1fr 52px}.dash-rank-row>div{display:none}}

/* EMISSÃO DO RELATÓRIO FITOSSANITÁRIO */
.relatorio-emissao{margin-bottom:14px}.relatorio-opcoes{display:grid;grid-template-columns:1fr 1fr 1.2fr auto;gap:10px;align-items:stretch}
.opcao-relatorio{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #dce8e1;border-radius:14px;background:#fff;cursor:pointer}
.opcao-relatorio input{accent-color:#247452}.opcao-relatorio strong{display:block;font-size:10px;color:#244b3c}.opcao-relatorio span{display:block;margin-top:3px;font-size:8px;color:#819289}
.relatorio-botoes{display:flex;gap:8px;align-items:stretch}
.botao-imprimir-relatorio{border:1px solid #cfe0d7;border-radius:14px;padding:0 16px;background:#fff;color:#173f34;font-size:10px;font-weight:900;cursor:pointer}
.botao-gerar-relatorio{border:0;border-radius:14px;padding:0 20px;background:#173f34;color:#fff;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 7px 18px rgba(23,63,52,.18)}
.botao-gerar-relatorio:disabled{opacity:.65;cursor:wait}
.relatorio-cabecalho-print{display:none}
.relatorio-impressao.pdf-export{background:#fff!important;box-shadow:none!important}
.relatorio-impressao.pdf-export .relatorio-cabecalho-print{display:flex!important;justify-content:space-between;align-items:center;gap:14px;border-bottom:2px solid #1f6d50;padding:0 0 12px;margin-bottom:15px}
.relatorio-impressao.pdf-export .relatorio-marca-print{display:flex!important;align-items:center;gap:8px;width:126px}.relatorio-impressao.pdf-export .relatorio-marca-print img{display:block!important;width:98px!important;height:70px!important;object-fit:contain!important}.relatorio-impressao.pdf-export .relatorio-marca-print>div{display:none!important}
.relatorio-impressao.pdf-export .relatorio-marca-print strong{display:block;font-size:16px;color:#173f34}.relatorio-impressao.pdf-export .relatorio-marca-print span{display:block;font-size:7px;letter-spacing:1px;color:#64796f}
.relatorio-impressao.pdf-export .relatorio-doc-print{flex:1;text-align:center!important}.relatorio-impressao.pdf-export .relatorio-doc-print b{display:block;font-size:12px;color:#173f34}.relatorio-impressao.pdf-export .relatorio-doc-print span{display:block;font-size:10px;color:#667b71;margin-top:3px}.relatorio-impressao.pdf-export .relatorio-doc-print small{display:block;font-size:8px;margin-top:4px;color:#64796f}
.relatorio-impressao.pdf-export .relatorio-cliente-logo-print{display:flex!important;width:110px;height:64px;align-items:center;justify-content:flex-end}.relatorio-impressao.pdf-export .relatorio-cliente-logo-print img{display:block!important;max-width:110px!important;max-height:64px!important;object-fit:contain!important}
.relatorio-impressao.pdf-export .relatorio-filtros button{display:none!important}.relatorio-impressao.pdf-export.relatorio-colorido,.relatorio-impressao.pdf-export.relatorio-colorido *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.relatorio-impressao.pdf-export.relatorio-pb{filter:grayscale(1)}
.relatorio-pb .relatorio-trilho i{background:#4b4b4b!important}.relatorio-pb .relatorio-selo{background:#4b4b4b!important}
@media(max-width:1000px){.relatorio-opcoes{grid-template-columns:1fr 1fr}.relatorio-botoes{min-height:52px}.botao-gerar-relatorio,.botao-imprimir-relatorio{min-height:52px}}
@media(max-width:650px){.relatorio-opcoes{grid-template-columns:1fr}.relatorio-botoes{flex-direction:column}}
@media print{
  @page{size:A4 portrait;margin:10mm}
  html,body,#root,.app,main{margin:0!important;padding:0!important;background:#fff!important;min-height:0!important;height:auto!important;overflow:visible!important}
  .sidebar,main>header{display:none!important}
  main>*:not(.relatorio-impressao){display:none!important}
  body *{visibility:hidden!important}
  .relatorio-impressao,.relatorio-impressao *{visibility:visible!important}
  .relatorio-impressao{display:block!important;position:static!important;left:auto!important;top:auto!important;width:100%!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:#fff!important;min-height:0!important}
  .relatorio-cabecalho-print{display:flex!important;justify-content:space-between;align-items:center;border-bottom:2px solid #1f6d50;padding:0 0 12px;margin-bottom:15px}
  .relatorio-marca-print{display:flex!important;align-items:center;gap:8px;width:112px}.relatorio-marca-print img{display:block!important;width:88px!important;height:64px!important;object-fit:contain!important}.relatorio-marca-print>div{display:none!important}
  .relatorio-marca-print strong{display:block;font-size:16px;color:#173f34}.relatorio-marca-print span{display:block;font-size:7px;letter-spacing:1px;color:#64796f}
  .relatorio-doc-print{text-align:right}.relatorio-doc-print b{display:block;font-size:11px;color:#173f34}.relatorio-doc-print span{display:block;font-size:9px;color:#667b71;margin-top:3px}
  .relatorio-fito-topo,.relatorio-filtros,.relatorio-kpis,.relatorio-grafico,.relatorio-tabela{break-inside:avoid}
  .relatorio-filtros{grid-template-columns:repeat(4,1fr)!important}.relatorio-filtros button{display:none!important}
  .relatorio-kpis{grid-template-columns:repeat(5,1fr)!important;gap:6px!important}.relatorio-kpis>div{padding:9px!important;min-height:auto!important}
  .relatorio-grafico{margin-top:8px!important}.relatorio-tabela{margin-top:9px!important;font-size:8px!important}
  .relatorio-tabela th,.relatorio-tabela td{padding:6px!important}
  .relatorio-colorido{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .relatorio-pb,.relatorio-pb *{-webkit-print-color-adjust:economy!important;print-color-adjust:economy!important;color:#222!important}
  .relatorio-pb .relatorio-trilho i,.relatorio-pb .relatorio-selo{background:#555!important}
}

/* IDENTIDADE VISUAL DO CLIENTE */
.cliente-logo-box{display:flex;align-items:center;gap:22px;padding:18px;border:1px solid #e1ebe5;border-radius:18px;background:#fbfdfc}
.cliente-logo-preview{width:180px;height:110px;border:1px dashed #cbdcd3;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:12px}
.cliente-logo-preview img{max-width:100%;max-height:100%;object-fit:contain}
.cliente-logo-vazia{text-align:center;color:#82958b}.cliente-logo-vazia strong{display:block;font-size:32px;color:#356d58}.cliente-logo-vazia span{display:block;font-size:8px;font-weight:800;margin-top:5px}
.cliente-logo-acoes{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.cliente-logo-acoes>strong{font-size:15px;color:#173f34}.cliente-logo-acoes>span{font-size:9px;color:#7a8d84}
.upload-logo-cliente{display:inline-flex!important;align-items:center;justify-content:center;cursor:pointer;margin:2px 0}.upload-logo-cliente input{display:none}
.botao-remover-logo{border:1px solid #e3caca;background:#fff7f7;color:#9b3f3f;border-radius:10px;padding:8px 12px;font-size:9px;font-weight:800;cursor:pointer}
.relatorio-cliente-logo-print{display:none}
@media(max-width:650px){.cliente-logo-box{flex-direction:column;align-items:flex-start}.cliente-logo-preview{width:100%}}
@media print{
  .relatorio-cabecalho-print{gap:14px}
  .relatorio-doc-print{flex:1;text-align:center!important}
  .relatorio-doc-print small{display:block!important;font-size:7px!important;margin-top:4px;color:#64796f!important}
  .relatorio-cliente-logo-print{display:flex!important;width:82px;height:50px;align-items:center;justify-content:flex-end}
  .relatorio-cliente-logo-print img{display:block!important;max-width:82px!important;max-height:50px!important;object-fit:contain!important}
}

.broca-operacional{margin-top:20px}
.broca-operacional-topo{align-items:flex-start}
.broca-regra{padding:10px 14px;border-radius:999px;background:#edf8f1;color:#176b3a;font-size:12px;font-weight:900;letter-spacing:.06em;white-space:nowrap}
.broca-fluxo{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}
.broca-fluxo>div{border:1px solid #e6ece8;border-radius:16px;padding:15px;background:#fbfdfb;display:grid;grid-template-columns:34px 1fr;column-gap:10px;align-items:center}
.broca-fluxo b{grid-row:1/3;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#173f2c;color:white;font-size:12px}
.broca-fluxo strong{font-size:14px;color:#173f2c}
.broca-fluxo span{font-size:12px;color:#718078;margin-top:2px}
.broca-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
.broca-kpis article{border:1px solid #e6ece8;border-radius:16px;padding:16px;background:white}
.broca-kpis small{display:block;color:#758078;font-size:10px;font-weight:800;letter-spacing:.05em}
.broca-kpis strong{display:block;font-size:24px;color:#173f2c;margin:6px 0}
.broca-kpis span{font-size:12px;color:#7a847e}
.broca-bloco{margin-top:18px}
.broca-tabela{min-width:1120px}
.broca-tabela td,.broca-tabela th{white-space:nowrap}
.broca-status{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:800}
.broca-status.concluido{background:#edf8f1;color:#176b3a}
.broca-status.aguardando{background:#fff5dc;color:#8b5a00}
@media(max-width:1000px){
  .broca-fluxo,.broca-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:650px){
  .broca-fluxo,.broca-kpis{grid-template-columns:1fr}
}


.broca-operacional-acoes{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.broca-nova-programacao{white-space:nowrap}
.broca-modal-fundo{position:fixed;inset:0;background:rgba(8,31,22,.56);z-index:9999;display:grid;place-items:center;padding:24px;overflow:auto}
.broca-modal{width:min(920px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.25);padding:24px}
.broca-modal-topo{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid #e5ebe7;padding-bottom:16px;margin-bottom:18px}
.broca-modal-topo span{font-size:11px;font-weight:900;letter-spacing:.09em;color:#23804b}
.broca-modal-topo h2{margin:5px 0 4px;color:#123f2c}
.broca-modal-topo p{margin:0;color:#748079}
.broca-modal-topo>button{border:0;background:#edf3ef;color:#174b35;width:38px;height:38px;border-radius:50%;font-size:24px;cursor:pointer}
.broca-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.broca-form-grid label{display:flex;flex-direction:column;gap:7px}
.broca-form-grid label>span{font-size:11px;font-weight:800;letter-spacing:.04em;color:#52675b}
.broca-form-grid input,.broca-form-grid select,.broca-form-grid textarea{width:100%;box-sizing:border-box;border:1px solid #d9e3dd;border-radius:11px;padding:12px 13px;background:#fff;color:#173f2c;font:inherit;outline:none}
.broca-form-grid input:focus,.broca-form-grid select:focus,.broca-form-grid textarea:focus{border-color:#4a9470;box-shadow:0 0 0 3px rgba(74,148,112,.12)}
.broca-form-grid input[readonly]{background:#f4f7f5;color:#617168}
.broca-form-largo{grid-column:1/-1}
.broca-modal-rodape{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
.broca-modal-rodape .voltar{margin:0}
@media(max-width:720px){
  .broca-form-grid{grid-template-columns:1fr}
  .broca-form-largo{grid-column:auto}
  .broca-operacional-acoes{justify-content:flex-start}
}



/* ===== PDF COLORIDO • PROGRAMAÇÃO DE BROCA ===== */
.botao-pdf-programacao-broca{border:0;border-radius:10px;background:#1768a4;color:#fff;font-weight:900;padding:11px 15px;cursor:pointer;box-shadow:0 7px 18px rgba(23,104,164,.2)}
.botao-pdf-programacao-broca:disabled{opacity:.65;cursor:wait}
.broca-programacao-pdf{display:none;width:1450px;background:#fff;color:#17382c;font-family:Arial,sans-serif;padding:28px}
.broca-programacao-pdf.pdf-export{display:block;position:fixed;left:-10000px;top:0;z-index:-1}
.bp-cabecalho{display:grid;grid-template-columns:270px 1fr 220px;align-items:center;gap:24px;border-bottom:6px solid #08734b;padding-bottom:15px}
.bp-marca{display:flex;align-items:center;gap:13px}.bp-marca img{width:92px;height:92px;object-fit:contain}.bp-marca b{display:block;color:#073e2b;font-size:22px}.bp-marca span{display:block;font-size:8px;line-height:1.35;color:#587066;margin-top:4px}
.bp-titulo{text-align:center}.bp-titulo small{color:#d19b00;font-weight:900;letter-spacing:2px;font-size:11px}.bp-titulo h1{font-size:30px;color:#073e2b;margin:6px 0 3px}.bp-titulo p{margin:0;color:#4d6c60;font-size:13px}
.bp-cliente-logo{height:90px;display:flex;align-items:center;justify-content:flex-end}.bp-cliente-logo img{max-width:190px;max-height:85px;object-fit:contain}.bp-sem-logo{font-weight:900;color:#9eb0a8;letter-spacing:2px}
.bp-faixa{display:grid;grid-template-columns:1.6fr .7fr .9fr 1fr;background:linear-gradient(90deg,#073e2b,#0b7650);color:#fff;margin-top:14px;border-radius:10px;padding:13px 17px;gap:18px}.bp-faixa small{display:block;font-size:8px;color:#9fe0c2;letter-spacing:1px}.bp-faixa strong{display:block;font-size:13px;margin-top:4px}
.bp-resumo{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:13px 0}.bp-resumo div{border:1px solid #d8e5df;border-radius:9px;padding:11px 14px;background:#f4f9f6}.bp-resumo span{display:block;font-size:8px;color:#688077;font-weight:800}.bp-resumo b{display:block;color:#08734b;font-size:20px;margin-top:4px}
.bp-tabela{width:100%;border-collapse:collapse;font-size:10px}.bp-tabela thead{background:#08734b;color:#fff}.bp-tabela th{padding:9px 7px;text-align:left;border-right:1px solid rgba(255,255,255,.18)}.bp-tabela td{padding:8px 7px;border-bottom:1px solid #dce8e2;vertical-align:top}.bp-tabela tbody tr:nth-child(even){background:#f3f8f5}.bp-tabela td:nth-child(1),.bp-tabela td:nth-child(5),.bp-tabela td:nth-child(6),.bp-tabela td:nth-child(7),.bp-tabela td:nth-child(8){white-space:nowrap}
.bp-rodape{margin-top:14px;border-top:2px solid #e4ece8;padding-top:12px;display:flex;justify-content:space-between;gap:30px;align-items:flex-end}.bp-rodape>div:first-child{max-width:850px}.bp-rodape b{display:block;color:#08734b;font-size:10px}.bp-rodape span{display:block;color:#637b71;font-size:9px;line-height:1.45;margin-top:3px}.bp-assinatura{text-align:right;min-width:210px}.bp-assinatura b{font-size:13px;color:#17382c}

/* ===== PAINEL APROVADO - COMPOSIÇÃO FINAL ===== */
@media(min-width:901px){
  .sidebar{width:196px!important;min-width:196px!important}
}
.brand{
  min-height:82px!important;height:82px!important;
  padding:8px 12px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  background:#f7faf8!important;border-bottom:3px solid #128257!important
}
.brand img{width:auto!important;height:64px!important;max-width:150px!important;max-height:64px!important;object-fit:contain!important}
.sidebar nav{padding:7px 9px 18px!important}
.grupo{font-size:8px!important;letter-spacing:1.65px!important;margin:15px 10px 6px!important;color:#80b9a2!important}
.nav{min-height:35px!important;padding:7px 10px!important;border-radius:9px!important;font-size:9.5px!important;margin-bottom:2px!important;gap:9px!important}
.nav i{width:18px!important;font-size:12px!important}
.usuario{padding:10px 9px!important;min-height:60px!important}
.usuario>b{width:34px!important;height:34px!important;font-size:13px!important}
.usuario strong{font-size:9px!important}.usuario span{font-size:7px!important;max-width:115px!important;overflow:hidden;text-overflow:ellipsis}
main{padding:12px 15px 24px!important}
.dashboard-ia{gap:9px!important;max-width:1600px;margin:0 auto;width:100%}

.dash-capa{
  min-height:104px!important;height:104px!important;
  padding:17px 22px!important;border-radius:16px!important;
  align-items:center!important;
  background:
    linear-gradient(90deg,rgba(3,28,20,.98),rgba(5,68,43,.91) 52%,rgba(12,90,56,.68)),
    radial-gradient(circle at 83% 25%,rgba(236,188,56,.22),transparent 23%),
    linear-gradient(135deg,#092b20,#176c49)!important;
  box-shadow:0 10px 30px rgba(0,0,0,.15)!important
}
.dash-capa-conteudo>span{font-size:8px!important;letter-spacing:1.7px!important}
.dash-capa h2{font-size:23px!important;margin:4px 0 3px!important;line-height:1.05!important}
.dash-capa p{font-size:8.5px!important}
.dash-data{min-width:215px!important;padding:11px 14px!important;border-radius:11px!important}
.dash-data small{font-size:7px!important}.dash-data strong{font-size:10px!important;margin-top:4px!important}

.dash-filtros{
  grid-template-columns:1.1fr 1.55fr .9fr .78fr!important;
  gap:8px!important;padding:9px 10px!important;border-radius:14px!important;
  background:#082c21!important;border:1px solid rgba(72,178,128,.24)!important
}
.dash-filtros label{gap:4px!important}.dash-filtros span{font-size:7.5px!important;color:#8db8a7!important}
.dash-filtros select{height:34px!important;border-radius:9px!important;padding:0 10px!important;font-size:9px!important;background:#061f18!important;border-color:#1a5c43!important;color:#f0f8f4!important}

.dash-kpis{gap:8px!important}
.dash-kpi{min-height:78px!important;border-radius:14px!important;padding:11px 13px!important;gap:10px!important}
.dash-kpi i{width:38px!important;height:38px!important;border-radius:10px!important;font-size:17px!important}
.dash-kpi span{font-size:8px!important}.dash-kpi strong{font-size:23px!important;margin:2px 0!important}.dash-kpi small{font-size:7px!important}

.dash-grid-principal{grid-template-columns:minmax(0,1.72fr) minmax(250px,.82fr) minmax(250px,.82fr)!important;gap:9px!important}
.dash-grid-secundario{grid-template-columns:1.18fr 1fr .9fr!important;gap:9px!important}
.dash-card{padding:12px!important;border-radius:14px!important;background:#082b21!important;border-color:rgba(72,178,128,.22)!important;box-shadow:0 8px 24px rgba(0,0,0,.12)!important}
.dash-card-titulo{margin-bottom:9px!important}.dash-card-titulo span{font-size:10px!important;color:#f1f8f5!important}.dash-card-titulo b{color:#35d08b!important}.dash-card-titulo small{font-size:6.5px!important;color:#79a994!important}.dash-card-titulo button{font-size:8px!important;color:#48d497!important}
.mapa-placeholder{height:246px!important;border-radius:11px!important;background:linear-gradient(135deg,#274c3c,#536b49)!important}
.mapa-real svg{inset:7px 7px 31px!important;width:calc(100% - 14px)!important;height:calc(100% - 38px)!important}
.mapa-real polygon{fill:#46b879!important;fill-opacity:.78!important;stroke:#e9fff4!important;stroke-width:1.2!important}
.mapa-real polygon:hover{fill:#6fd79d!important;stroke:#f2c94c!important}
.mapa-legenda{left:9px!important;right:9px!important;bottom:8px!important;padding:7px 9px!important;font-size:7px!important;background:rgba(3,25,18,.9)!important}
.mapa-legenda strong{font-size:7px!important}
.anel-wrap{min-height:246px!important;gap:14px!important}.anel{width:112px!important;height:112px!important;background:radial-gradient(circle at center,#082b21 52%,transparent 53%),conic-gradient(#20c47a 0 48%,#3198d3 48% 73%,#efbd2d 73% 100%)!important}
.anel strong{font-size:23px!important;color:#fff!important}.anel span{font-size:7px!important;color:#87ad9d!important}
.anel-lista{min-width:105px!important}.anel-lista div{font-size:7.5px!important;padding:7px 0!important;border-color:rgba(255,255,255,.08)!important;color:#cde1d8!important}.anel-lista b{color:#fff!important}
.inteligencia{background:linear-gradient(180deg,#0a3226,#07271e)!important}
.insight{padding:9px!important;border-radius:10px!important;margin-bottom:7px!important;background:#0a3528!important;border-color:rgba(255,255,255,.08)!important}
.insight>b{width:25px!important;height:25px!important;border-radius:7px!important}.insight strong{font-size:8px!important;color:#f2f8f5!important}.insight span{font-size:7px!important;color:#8eaea0!important}
.mini-cards{gap:7px!important}.mini-cards>div{padding:10px!important;border-radius:10px!important;background:#0a3528!important;border-color:rgba(255,255,255,.08)!important}.mini-cards small{font-size:6.5px!important}.mini-cards strong{font-size:11px!important;color:#f0f8f4!important}.mini-cards span{font-size:7px!important;color:#8eaea0!important}
.status-lista>div{padding:8px 2px!important;font-size:8px!important;border-color:rgba(255,255,255,.08)!important;color:#dbeae3!important}.status-lista b{font-size:7px!important;color:#45cf91!important}
.atalhos-dash{gap:6px!important}.atalhos-dash button{min-height:44px!important;border-radius:9px!important;background:#0a3528!important;border-color:rgba(255,255,255,.08)!important;color:#43d291!important}.atalhos-dash span{font-size:7.5px!important;color:#dbeae3!important}

@media(max-width:1250px){
  .dash-grid-principal{grid-template-columns:1.35fr 1fr!important}
  .inteligencia{grid-column:1/-1!important}
  .dash-grid-secundario{grid-template-columns:1fr 1fr!important}
}


/* ===== COMMAND CENTER • PAINEL RECONSTRUÍDO ===== */
@media(min-width:901px){.sidebar{width:190px!important;min-width:190px!important}.brand{height:74px!important;min-height:74px!important;padding:0!important}.brand img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;transform:scale(1.08)!important}main{padding:0 10px 14px!important}}
.command-center{font-family:Arial,sans-serif;color:#eefaf5;max-width:1680px;margin:auto;padding:8px 0 0}
.cc-topo{height:78px;border:1px solid #135941;border-radius:13px 13px 0 0;display:grid;grid-template-columns:1.25fr 1.05fr 42px 185px 190px;gap:9px;align-items:center;padding:0 13px;background:linear-gradient(90deg,rgba(4,34,25,.96),rgba(7,63,43,.93),rgba(63,70,27,.72));position:relative;overflow:hidden}
.cc-topo:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 72% 50%,rgba(247,190,53,.16),transparent 24%),linear-gradient(115deg,transparent 60%,rgba(33,119,72,.22))}
.cc-topo>*{position:relative;z-index:1}.cc-topo-identidade strong{display:block;font-size:16px}.cc-topo-identidade span{display:block;font-size:9px;margin-top:5px;color:#c6dbd2}.cc-busca{height:38px;border:1px solid rgba(255,255,255,.22);border-radius:9px;background:rgba(5,23,18,.68);display:flex;align-items:center;gap:10px;padding:0 12px;font-size:17px}.cc-busca span{font-size:9px;color:#a9bbb3}.cc-alerta{height:40px;border:1px solid #1c654a;border-radius:9px;background:#06251b;color:#fff;position:relative}.cc-alerta i{position:absolute;right:5px;top:3px;background:#e52d2d;width:14px;height:14px;border-radius:50%;font-size:8px;display:grid;place-items:center}.cc-usuario,.cc-data{height:42px;border:1px solid #1b654a;border-radius:9px;background:#06251b;display:flex;align-items:center;gap:8px;padding:0 10px}.cc-usuario>b{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#1b79a9}.cc-usuario strong,.cc-data strong{display:block;font-size:9px}.cc-usuario span,.cc-data span{display:block;font-size:8px;color:#afc5bb;margin-top:2px}.cc-data>b{font-size:18px}
.cc-filtros{display:grid;grid-template-columns:1.2fr 1.2fr 1fr .75fr 145px;gap:8px;align-items:end;padding:8px 10px;background:#05271e;border:1px solid #12533e;border-top:0}.cc-filtros label span{display:block;font-size:8px;margin-bottom:4px;color:#d3e4dc}.cc-filtros select{width:100%;height:32px;border:1px solid #1b644a;border-radius:7px;background:#061d17;color:#fff;padding:0 8px;font-size:8.5px}.cc-filtros>button{height:34px;border:0;border-radius:7px;background:#06a65e;color:#fff;font-size:9px;font-weight:800}
.cc-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0}.cc-kpi{min-height:82px;border-radius:11px;border:1px solid;display:flex;align-items:center;gap:11px;text-align:left;padding:10px 12px;color:#fff;cursor:pointer}.cc-kpi i{width:40px;height:40px;border-radius:8px;display:grid;place-items:center;font-size:20px;background:rgba(255,255,255,.13)}.cc-kpi span{font-size:9px}.cc-kpi strong{display:block;font-size:20px;margin:3px 0}.cc-kpi small{font-size:8px;color:#d5e5de}.k-verde{background:linear-gradient(135deg,#0b3c29,#075c31);border-color:#16814d}.k-azul{background:linear-gradient(135deg,#092e45,#07558b);border-color:#1377b6}.k-ouro{background:linear-gradient(135deg,#3a3211,#756014);border-color:#92791a}.k-ciano{background:linear-gradient(135deg,#073e3a,#07655d);border-color:#138f82}.k-roxo{background:linear-gradient(135deg,#282044,#3b2b73);border-color:#5e4d9b}
.cc-corpo{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(315px,.75fr);gap:8px}.cc-col-esquerda,.cc-col-direita{display:flex;flex-direction:column;gap:8px}.cc-card{background:linear-gradient(180deg,#062b22,#05231c);border:1px solid #145d46;border-radius:10px;padding:9px}.cc-card>header{min-height:25px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);padding:0 3px 7px;margin-bottom:8px}.cc-card header strong{font-size:10px}.cc-card header small{font-size:6.5px;color:#7fb49d;letter-spacing:1px}.cc-card header button{border:0;background:transparent;color:#b8d3c8;font-size:8px;cursor:pointer}
.cc-mapa>header div{display:flex;gap:3px}.cc-mapa>header div button{padding:5px 9px;border:1px solid #285f4d;background:#08251e;border-radius:5px;color:#dceae4}.cc-mapa>header div button:first-child{background:#e6eee9;color:#123b2d}
.cc-mapa-canvas{height:380px;border-radius:8px;position:relative;overflow:hidden;background:radial-gradient(circle at 20% 20%,#456640 0 7%,transparent 8%),radial-gradient(circle at 70% 65%,#6b7034 0 9%,transparent 10%),linear-gradient(135deg,#334b2f,#617044 38%,#344e32 62%,#65713f);box-shadow:inset 0 0 50px rgba(0,0,0,.28)}
.cc-mapa-canvas:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(23deg,transparent 0 48px,rgba(238,215,131,.12) 49px 51px,transparent 52px 100px),repeating-linear-gradient(112deg,transparent 0 72px,rgba(255,255,255,.06) 73px 74px,transparent 75px 135px)}
.cc-mapa-canvas svg{position:absolute;inset:12px;width:calc(100% - 24px);height:calc(100% - 24px);z-index:1}.cc-mapa-canvas polygon{stroke:#f7d84a;stroke-width:1.2;fill-opacity:.62}.cc-mapa-canvas .p0{fill:#15b868}.cc-mapa-canvas .p1{fill:#e3b31e}.cc-mapa-canvas .p2{fill:#1686d8}.cc-mapa-canvas .p3{fill:#ec7620}.cc-mapa-canvas .p4{fill:#8c4bd4}
.cc-mapa-info{position:absolute;z-index:2;left:15px;top:14px;background:rgba(3,26,19,.82);border:1px solid #39735d;border-radius:7px;padding:7px 9px}.cc-mapa-info b{display:block;font-size:9px}.cc-mapa-info span{font-size:7px;color:#bad1c6}.cc-mapa-legenda{position:absolute;z-index:2;left:12px;bottom:10px;display:flex;gap:15px;background:rgba(3,24,18,.85);padding:7px 10px;border-radius:7px;font-size:7px}.cc-mapa-legenda i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px}.l1{background:#15b868}.l2{background:#e3b31e}.l3{background:#1686d8}.cc-sem-dados{position:absolute;inset:0;display:grid;place-content:center;text-align:center;z-index:2}.cc-sem-dados b{font-size:28px}.cc-sem-dados strong,.cc-sem-dados span{display:block}
.cc-dupla{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cc-tripla{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:8px}.cc-pragas,.cc-cert{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cc-pragas>div,.cc-cert>div{border:1px solid #174d3d;border-radius:8px;background:#092f25;padding:9px}.cc-pragas span{font-size:8px}.cc-pragas strong{display:block;font-size:16px;margin:5px 0}.cc-pragas small{font-size:7px;color:#9db8ac}.cc-cert>div{display:grid;grid-template-columns:28px 1fr;align-items:center}.cc-cert b{font-size:19px}.cc-cert strong{font-size:9px}.cc-cert em{grid-column:2;font-size:7px;color:#8fb2a2;font-style:normal}
.cc-donut-wrap{min-height:155px;display:flex;align-items:center;gap:16px}.cc-donut{width:108px;height:108px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#062b22 0 47%,transparent 48%),conic-gradient(#09b66a 0 43%,#e3b31e 43% 62%,#1686d8 62% 80%,#8c4bd4 80% 100%)}.cc-donut strong{font-size:14px}.cc-donut span{font-size:7px;color:#a9c4b7}.cc-donut-list{flex:1}.cc-donut-list div{display:grid;grid-template-columns:10px 1fr auto;gap:6px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:7.5px}.cc-donut-list i{width:8px;height:8px;border-radius:50%;background:#16bd72}.cc-donut-list div:nth-child(2) i{background:#1686d8}.cc-donut-list div:nth-child(3) i{background:#e3b31e}
.cc-inteligencia{background:linear-gradient(180deg,#063529,#06261f)}.cc-insight{display:grid;grid-template-columns:31px 1fr;gap:8px;align-items:center;padding:8px;border:1px solid #174d3d;border-radius:8px;background:#082d24;margin-bottom:6px}.cc-insight>b{font-size:25px;text-align:center}.cc-insight.ok>b{color:#10d873}.cc-insight.at>b{color:#f0523c}.cc-insight.info>b{color:#2dc6d0}.cc-insight strong{font-size:8px}.cc-insight span{display:block;font-size:7px;color:#9eb8ad;margin-top:3px;line-height:1.3}
.cc-mini{min-height:112px}.cc-vazio{display:flex;align-items:center;gap:10px;min-height:65px;color:#8fb0a1}.cc-vazio b{font-size:27px}.cc-vazio span{font-size:7.5px;line-height:1.35}.cc-ativ div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:7.5px}.cc-ativ b{color:#38d68d}.cc-ativ em{font-style:normal;color:#91ac9f}.cc-loading{position:fixed;right:20px;bottom:20px;background:#08a963;padding:9px 14px;border-radius:8px;font-size:9px;box-shadow:0 8px 30px #0008}
@media(max-width:1250px){.cc-topo{grid-template-columns:1fr 1fr 42px}.cc-usuario,.cc-data{display:none}.cc-corpo{grid-template-columns:1fr}.cc-col-direita{display:grid;grid-template-columns:repeat(3,1fr)}}
@media(max-width:900px){.cc-topo{grid-template-columns:1fr}.cc-busca,.cc-alerta{display:none}.cc-filtros,.cc-kpis,.cc-dupla,.cc-tripla,.cc-col-direita{grid-template-columns:1fr!important}.cc-mapa-canvas{height:300px}}


/* ===== FECHAMENTO VISUAL • DESKTOP 16:9 + LOGO ===== */
@media(min-width:1280px){
  .app{height:100vh!important;overflow:hidden!important}
  .sidebar{width:188px!important;min-width:188px!important;height:100vh!important}
  .brand{
    height:100px!important;min-height:100px!important;padding:0!important;margin:0!important;
    background:#fff!important;border-bottom:3px solid #0b8b5d!important;
    display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important
  }
  .brand img{
    width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;
    object-fit:cover!important;object-position:center!important;transform:scale(1.18)!important
  }
  .sidebar nav{height:calc(100vh - 160px)!important;overflow-y:auto!important;padding-top:7px!important}
  .grupo{margin:11px 12px 5px!important;font-size:7px!important}
  .nav{min-height:27px!important;padding:5px 13px!important;font-size:8px!important}
  .nav i{width:18px!important;font-size:10px!important}
  .usuario{height:57px!important;min-height:57px!important;padding:7px 8px!important}

  main{height:100vh!important;overflow-y:auto!important;padding:0 8px 8px!important}
  .command-center{padding-top:5px!important}
  .cc-topo{height:64px!important;grid-template-columns:1.15fr 1.05fr 38px 170px 175px!important}
  .cc-topo-identidade strong{font-size:14px!important}
  .cc-busca{height:34px!important}
  .cc-usuario,.cc-data{height:36px!important}
  .cc-filtros{padding:5px 8px!important}
  .cc-filtros select{height:28px!important}
  .cc-filtros>button{height:30px!important}
  .cc-kpis{gap:6px!important;margin:6px 0!important}
  .cc-kpi{min-height:66px!important;padding:7px 9px!important;gap:8px!important}
  .cc-kpi i{width:34px!important;height:34px!important;font-size:16px!important}
  .cc-kpi strong{font-size:17px!important;margin:2px 0!important}
  .cc-kpi small{font-size:7px!important}
  .cc-corpo{gap:6px!important}
  .cc-col-esquerda,.cc-col-direita{gap:6px!important}
  .cc-card{padding:7px!important}
  .cc-card>header{min-height:21px!important;padding-bottom:5px!important;margin-bottom:6px!important}
  .cc-mapa-canvas{height:315px!important}
  .cc-donut-wrap{min-height:125px!important}
  .cc-donut{width:90px!important;height:90px!important}
  .cc-insight{padding:6px!important;margin-bottom:4px!important}
  .cc-insight>b{font-size:20px!important}
  .cc-mini{min-height:90px!important}
  .cc-vazio{min-height:48px!important}
  .cc-pragas>div,.cc-cert>div{padding:6px!important}
  .cc-pragas strong{font-size:13px!important;margin:3px 0!important}
}


/* ===== AJUSTE FINO • LOGO + SIDEBAR DA REFERÊNCIA + MAPA MENOR ===== */
@media(min-width:1280px){
  .sidebar{
    width:198px!important;min-width:198px!important;
    background:linear-gradient(180deg,#032a23 0%,#031f1b 100%)!important;
    border-right:1px solid #12604b!important
  }
  .brand{
    height:78px!important;min-height:78px!important;
    padding:4px 8px!important;background:#fff!important;
    border-bottom:2px solid #087c54!important;box-sizing:border-box!important
  }
  .brand img{
    width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;
    object-fit:contain!important;object-position:center!important;transform:none!important
  }
  .sidebar nav{
    height:calc(100vh - 136px)!important;padding:5px 6px 8px!important;
    scrollbar-width:thin!important
  }
  .grupo{
    margin:9px 8px 3px!important;padding:0!important;
    color:#58d8bc!important;font-size:7px!important;font-weight:900!important;
    letter-spacing:.7px!important;text-align:left!important
  }
  .nav{
    min-height:24px!important;margin:1px 0!important;padding:4px 8px!important;
    border-radius:5px!important;font-size:7.6px!important;font-weight:600!important;
    gap:4px!important;color:#edf9f5!important
  }
  .nav i{
    width:15px!important;min-width:15px!important;font-size:9px!important;
    color:#d8f2e8!important
  }
  .nav.ativo{
    background:linear-gradient(90deg,#07834f,#05a661)!important;
    color:#fff!important;box-shadow:inset 0 0 0 1px #18bb77!important
  }
  .nav.ativo i{color:#fff!important}
  .usuario{height:53px!important;min-height:53px!important}

  .cc-mapa-canvas{height:245px!important}
  .cc-mapa>header{margin-bottom:5px!important}
  .cc-corpo{grid-template-columns:minmax(0,1.7fr) minmax(300px,.72fr)!important}
  .cc-dupla{gap:6px!important}
  .cc-tripla{gap:6px!important}
  .cc-donut-wrap{min-height:105px!important}
  .cc-donut{width:78px!important;height:78px!important}
  .cc-donut strong{font-size:12px!important}
  .cc-insight{min-height:42px!important}
}


/* ===== LOGO • TAMANHO INTERMEDIÁRIO DEFINITIVO ===== */
@media(min-width:1280px){
  .brand{
    height:94px!important;
    min-height:94px!important;
    padding:1px 3px!important;
    background:#fff!important;
    overflow:hidden!important;
  }
  .brand img{
    width:100%!important;
    height:100%!important;
    max-width:none!important;
    max-height:none!important;
    object-fit:contain!important;
    object-position:center!important;
    transform:scale(1.13)!important;
    transform-origin:center!important;
  }
  .sidebar nav{
    height:calc(100vh - 152px)!important;
  }
}


/* ===== BROCA • EXCLUSÃO SEGURA DE PROGRAMAÇÃO ===== */
.broca-excluir-programacao{
  border:1px solid #ef6b63;background:#fff1f0;color:#b42318;
  border-radius:7px;padding:6px 10px;font-size:11px;font-weight:900;cursor:pointer
}
.broca-excluir-programacao:hover{background:#b42318;color:#fff}


/* ===== BROCA • TABELA COM AÇÃO VISÍVEL + TELA COMPACTA ===== */
.broca-operacional{padding:18px!important}
.broca-operacional-topo{margin-bottom:14px!important}
.broca-operacional-topo h2{margin:4px 0!important}
.broca-operacional-topo p{margin:4px 0!important;line-height:1.35!important}
.broca-fluxo{gap:10px!important;margin:12px 0!important}
.broca-fluxo>div{min-height:78px!important;padding:12px 14px!important}
.broca-resumo{gap:10px!important;margin:12px 0 16px!important}
.broca-resumo>div{min-height:96px!important;padding:14px!important}
.broca-resumo strong{font-size:25px!important}
.broca-tabela-wrap{overflow-x:hidden!important}
.broca-tabela{width:100%!important;table-layout:fixed!important;font-size:11px!important}
.broca-tabela th,.broca-tabela td{padding:10px 8px!important;white-space:normal!important;overflow-wrap:anywhere!important}
.broca-tabela th:nth-child(1),.broca-tabela td:nth-child(1){width:7%!important}
.broca-tabela th:nth-child(2),.broca-tabela td:nth-child(2){width:25%!important}
.broca-tabela th:nth-child(3),.broca-tabela td:nth-child(3){width:10%!important}
.broca-tabela th:nth-child(4),.broca-tabela td:nth-child(4){width:10%!important}
.broca-tabela th:nth-child(5),.broca-tabela td:nth-child(5){width:13%!important}
.broca-tabela th:nth-child(6),.broca-tabela td:nth-child(6){width:22%!important}
.broca-tabela th:nth-child(7),.broca-tabela td:nth-child(7){width:13%!important;text-align:center!important}
.broca-status{display:inline-flex!important;white-space:nowrap!important;padding:7px 10px!important;font-size:10px!important}
.broca-excluir-programacao{white-space:nowrap!important;padding:7px 11px!important}
@media(max-width:1200px){
  .broca-tabela-wrap{overflow-x:auto!important}
  .broca-tabela{min-width:900px!important}
}


/* ===== BROCA • CORREÇÃO FINAL DE LARGURA / AÇÕES ===== */
.broca-operacional,
.broca-bloco,
.broca-bloco>.tabela-wrap{min-width:0!important;max-width:100%!important}
.broca-bloco>.tabela-wrap{width:100%!important;overflow-x:auto!important;overflow-y:visible!important;-webkit-overflow-scrolling:touch}
.broca-bloco .broca-tabela{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important}
.broca-bloco .broca-tabela th,
.broca-bloco .broca-tabela td{padding:9px 6px!important;font-size:10px!important;white-space:normal!important;overflow-wrap:break-word!important;vertical-align:middle!important}
.broca-bloco .broca-tabela th:nth-child(1),.broca-bloco .broca-tabela td:nth-child(1){width:7%!important}
.broca-bloco .broca-tabela th:nth-child(2),.broca-bloco .broca-tabela td:nth-child(2){width:23%!important}
.broca-bloco .broca-tabela th:nth-child(3),.broca-bloco .broca-tabela td:nth-child(3){width:10%!important}
.broca-bloco .broca-tabela th:nth-child(4),.broca-bloco .broca-tabela td:nth-child(4){width:10%!important}
.broca-bloco .broca-tabela th:nth-child(5),.broca-bloco .broca-tabela td:nth-child(5){width:13%!important}
.broca-bloco .broca-tabela th:nth-child(6),.broca-bloco .broca-tabela td:nth-child(6){width:17%!important;text-align:center!important}
.broca-bloco .broca-tabela th:nth-child(7),.broca-bloco .broca-tabela td:nth-child(7){width:20%!important;text-align:center!important}
.broca-bloco .broca-tabela td:nth-child(7) button{display:block!important;width:100%!important;max-width:150px!important;margin:4px auto!important;padding:7px 6px!important;font-size:9px!important;white-space:nowrap!important}
.broca-bloco .broca-status{max-width:100%!important;white-space:normal!important;justify-content:center!important;text-align:center!important;line-height:1.15!important}
@media(max-width:1050px){
  .broca-bloco>.tabela-wrap{overflow-x:auto!important}
  .broca-bloco .broca-tabela{min-width:820px!important}
}

/* ===== PAINEL 2026 • CENTRAL DE INTELIGÊNCIA AGRÍCOLA ===== */
.command-center{max-width:none!important;padding:6px 8px 18px!important}
.cc-topo{background:linear-gradient(110deg,#052b21 0%,#073d2d 58%,#294c23 100%)!important;border:1px solid #1a674c!important;border-radius:15px!important;padding:11px 14px!important;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.cc-topo-identidade strong{font-size:17px!important;letter-spacing:.1px}.cc-topo-identidade span{opacity:.72}
.cc-filtros{margin-top:7px!important;border-radius:12px!important;padding:9px 11px!important;background:#062a21!important}
.cc-kpis{gap:7px!important;margin:7px 0!important}
.cc-kpi{min-height:72px!important;border-radius:12px!important;padding:9px 11px!important;box-shadow:0 7px 20px rgba(0,0,0,.13);transition:.18s ease}
.cc-kpi:hover{transform:translateY(-2px);filter:brightness(1.08)}
.cc-kpi i{width:36px!important;height:36px!important}.cc-kpi strong{font-size:19px!important}.cc-kpi small{opacity:.78}
.cc-operacao-faixa{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;gap:7px;margin:0 0 7px}
.cc-op-card{position:relative;min-height:82px;border:1px solid #185b46;border-radius:12px;background:linear-gradient(145deg,#072d23,#0a392b);padding:11px 13px;color:#edf9f4;text-align:left;box-shadow:0 7px 20px rgba(0,0,0,.12)}
button.cc-op-card{cursor:pointer}
.cc-op-card span{display:block;font-size:7px;letter-spacing:1.1px;color:#7eb69e;font-weight:800}
.cc-op-card strong{display:block;font-size:25px;line-height:1;margin:7px 0 4px;color:#fff}
.cc-op-card small{font-size:8px;color:#aac8bb}.cc-op-card em{position:absolute;right:12px;bottom:10px;font-size:8px;color:#a8e8c9;font-style:normal;font-weight:800}
.cc-op-destaque{background:linear-gradient(135deg,#075b38,#07824a);border-color:#17a661}.cc-op-destaque span,.cc-op-destaque small{color:#d7f7e7}
.cc-corpo{grid-template-columns:minmax(0,1.55fr) minmax(330px,.72fr)!important;gap:7px!important}
.cc-col-esquerda,.cc-col-direita{gap:7px!important}
.cc-card{border-radius:12px!important;border-color:#155d46!important;box-shadow:0 8px 24px rgba(0,0,0,.10)}
.cc-mapa.sem-geometria .cc-mapa-canvas{height:170px!important}
.cc-mapa.tem-geometria .cc-mapa-canvas{height:300px!important}
.cc-mapa.sem-geometria .cc-mapa-canvas{background:linear-gradient(135deg,#173a2d,#36513a)!important}
.cc-mapa.sem-geometria .cc-mapa-canvas:before{opacity:.25}
.cc-sem-dados b{font-size:20px!important;opacity:.7}.cc-sem-dados strong{font-size:14px!important}.cc-sem-dados span{font-size:10px!important;opacity:.75;margin-top:4px}
.cc-dupla{grid-template-columns:1.15fr .85fr!important;gap:7px!important}
.cc-pragas>div,.cc-cert>div{min-height:65px;background:linear-gradient(145deg,#082e24,#0b392c)!important}
.cc-pragas strong{font-size:14px!important}
.cc-col-direita .cc-inteligencia{order:-3;background:linear-gradient(155deg,#063125,#074331)!important;border-color:#18815c!important}
.cc-col-direita .cc-inteligencia header strong{color:#dff9ec}
.cc-insight{min-height:67px!important}
.cc-col-direita>.cc-card:not(.cc-inteligencia){background:linear-gradient(180deg,#062b22,#05241c)!important}
.cc-donut{width:110px!important;height:110px!important}
.cc-tripla{grid-template-columns:.9fr 1.2fr .9fr!important}
.cc-mini{min-height:120px}
.cc-loading{right:22px!important;bottom:18px!important;border-radius:10px!important;box-shadow:0 8px 30px rgba(0,0,0,.25)}
@media(max-width:1250px){.cc-operacao-faixa{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){.cc-operacao-faixa{grid-template-columns:1fr}.cc-mapa.sem-geometria .cc-mapa-canvas{height:210px!important}}


/* ===== FECHAMENTO FINAL DO PAINEL • 24/09/2026 ===== */
@media(min-width:1280px){
  .app{height:100vh!important;overflow:hidden!important}
  .sidebar{width:190px!important;min-width:190px!important;height:100vh!important}
  .brand{height:86px!important;min-height:86px!important}
  .brand img{object-fit:contain!important;transform:scale(1.05)!important}
  .sidebar nav{height:calc(100vh - 143px)!important;padding:5px 6px!important}
  .grupo{margin:8px 8px 3px!important}
  .nav{min-height:25px!important;margin:1px 0!important;padding:4px 9px!important}
  .usuario{height:57px!important;min-height:57px!important}
  main{height:100vh!important;overflow-y:auto!important;padding:0 7px 7px!important}

  .command-center{padding:5px 4px 8px!important}
  .cc-topo{height:58px!important;min-height:58px!important;padding:4px 12px!important;border-radius:13px!important}
  .cc-topo-identidade strong{font-size:15px!important}
  .cc-topo-identidade span{font-size:8px!important;margin-top:3px!important}
  .cc-busca{height:32px!important}.cc-alerta{height:34px!important}
  .cc-usuario,.cc-data{height:34px!important}

  .cc-filtros{margin-top:5px!important;padding:6px 9px!important;gap:7px!important}
  .cc-filtros label span{font-size:7px!important;margin-bottom:3px!important}
  .cc-filtros select{height:31px!important;font-size:8px!important}
  .cc-filtros>button{height:32px!important}

  .cc-kpis{gap:6px!important;margin:6px 0!important}
  .cc-kpi{min-height:67px!important;padding:7px 10px!important;gap:8px!important}
  .cc-kpi i{width:34px!important;height:34px!important}
  .cc-kpi strong{font-size:18px!important;margin:2px 0!important}
  .cc-kpi small{font-size:7px!important}

  .cc-operacao-faixa{gap:6px!important;margin-bottom:6px!important}
  .cc-op-card{min-height:70px!important;padding:9px 12px!important}
  .cc-op-card strong{font-size:22px!important;margin:5px 0 3px!important}
  .cc-op-card small,.cc-op-card em{font-size:7px!important}

  .cc-corpo{grid-template-columns:minmax(0,1.7fr) minmax(300px,.72fr)!important;gap:6px!important}
  .cc-col-esquerda,.cc-col-direita{gap:6px!important}
  .cc-card{padding:7px!important}
  .cc-card>header{min-height:22px!important;margin-bottom:5px!important;padding-bottom:5px!important}
  .cc-card>header strong{font-size:9px!important}
  .cc-card>header button,.cc-card>header small{font-size:7px!important}

  .cc-mapa.tem-geometria .cc-mapa-canvas{height:255px!important}
  .cc-mapa.sem-geometria .cc-mapa-canvas{height:150px!important}
  .cc-mapa-info{left:12px!important;top:12px!important;padding:8px 10px!important}
  .cc-mapa-info b{font-size:9px!important}.cc-mapa-info span{font-size:7px!important}
  .cc-mapa-legenda{padding:5px 8px!important;font-size:7px!important}

  .cc-dupla{gap:6px!important}
  .cc-pragas>div,.cc-cert>div{min-height:55px!important;padding:6px 8px!important}
  .cc-pragas strong{font-size:12px!important}
  .cc-pragas span,.cc-pragas small,.cc-cert strong,.cc-cert em{font-size:7px!important}

  .cc-tripla{gap:6px!important}
  .cc-mini{min-height:92px!important}
  .cc-vazio{min-height:45px!important}
  .cc-vazio b{font-size:17px!important}.cc-vazio span{font-size:7px!important}
  .cc-ativ>div{padding:5px 2px!important;font-size:7px!important}

  .cc-donut-wrap{min-height:112px!important}
  .cc-donut{width:86px!important;height:86px!important}
  .cc-donut strong{font-size:13px!important}.cc-donut span{font-size:7px!important}
  .cc-donut-list>div{padding:5px 0!important;font-size:7px!important}

  .cc-insight{min-height:52px!important;padding:6px!important;margin-bottom:4px!important}
  .cc-insight>b{font-size:18px!important}
  .cc-insight strong{font-size:8px!important}.cc-insight span{font-size:7px!important}
}

/* O mapa usa o filtro de Fazenda para dar zoom real na propriedade.
   Em "Todas as fazendas" ele mantém a visão geral das áreas cadastradas. */
.cc-mapa-canvas svg{width:100%!important;height:100%!important;display:block!important}
.cc-mapa-canvas polygon{vector-effect:non-scaling-stroke;stroke-width:1.15!important;transition:.15s ease}
.cc-mapa-canvas polygon:hover{filter:brightness(1.35);stroke-width:2.2!important}


/* RELATÓRIOS COMPARTILHÁVEIS */
.relatorios-grid{display:grid;gap:12px;margin-top:16px}.relatorio-link-card{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:16px 18px;border:1px solid #dbe8df;border-radius:14px;background:#fff}.relatorio-link-card>div:first-child{display:grid;gap:4px}.relatorio-link-card small{font-size:11px;font-weight:900;color:#08783e}.relatorio-link-card strong{color:#173e2c}.relatorio-link-card span{font-size:13px;color:#6a776f}.relatorio-link-card.revogado{opacity:.62;background:#f5f5f5}.relatorio-link-card.revogado small{color:#8d3434}.relatorio-link-acoes{display:flex;gap:8px;flex-wrap:wrap}.relatorio-link-acoes button{border:1px solid #b9d4c4;background:#f2faf5;color:#145b35;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.relatorio-link-acoes .perigo{border-color:#eccaca;background:#fff5f5;color:#a32626}.relatorios-vazio{padding:22px;text-align:center;color:#78857d;background:#f7faf8;border-radius:12px;margin-top:14px}
.rp-shell{min-height:100vh;background:#edf3ef;padding:28px;font-family:Arial,sans-serif;color:#18382a}.rp-page{max-width:1240px;margin:auto}.rp-loading,.rp-erro{max-width:650px;margin:12vh auto;background:#fff;padding:36px;border-radius:20px;box-shadow:0 18px 60px rgba(0,0,0,.12);text-align:center}.rp-header{display:flex;align-items:center;gap:22px;background:linear-gradient(135deg,#073a22,#0b6b3a);color:#fff;border-radius:22px;padding:24px 28px;box-shadow:0 18px 50px rgba(4,45,25,.2)}.rp-logo-box{width:150px;height:108px;flex:0 0 150px;background:#fff;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center}.rp-logo-box img{width:100%;height:100%;object-fit:contain;display:block}.rp-logo-souza{width:150px;height:122px;flex:0 0 150px;padding:0}.rp-logo-souza img{width:100%;height:100%;object-fit:contain;object-position:center;transform:scale(1.20);transform-origin:center;display:block}.rp-logo-cliente img{padding:7px;box-sizing:border-box}.rp-header-conteudo{flex:1;min-width:280px;text-align:center}.rp-header-conteudo>small{display:block;font-size:16px;line-height:1.25;font-weight:800;letter-spacing:.9px;opacity:.88}.rp-header h1{margin:8px 0 7px;font-size:25px;line-height:1.12;font-weight:800;letter-spacing:-.35px}.rp-header p{margin:0;font-size:15px;line-height:1.35;opacity:.9}.rp-header button{border:1px solid rgba(255,255,255,.4);background:#fff;color:#0a5c34;border-radius:10px;padding:12px 16px;font-size:16px;line-height:1.2;font-weight:800;cursor:pointer;white-space:nowrap}.rp-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:16px 0}.rp-kpis article{background:#fff;border-radius:15px;padding:16px;border:1px solid #dce8e0}.rp-kpis span,.rp-kpis small{display:block;color:#6e7b74;font-size:14px}.rp-kpis strong{display:block;font-size:32px;line-height:1;color:#0a6338;margin:8px 0}.rp-card{background:#fff;border:1px solid #dce8e0;border-radius:18px;padding:20px;margin:16px 0;box-shadow:0 8px 28px rgba(20,55,36,.06)}.rp-title{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:15px}.rp-title small{font-size:14px;line-height:1.2;font-weight:800;letter-spacing:.7px;color:#0a6b3b}.rp-title h2{margin:6px 0 0;font-size:25px;line-height:1.15;font-weight:800}.rp-title>span{font-size:15px;color:#68766e}.rp-table-wrap{overflow-x:auto}.rp-card table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.35}.rp-card th{text-align:left;background:#edf6f0;color:#315443;padding:11px;font-size:12px;letter-spacing:.35px}.rp-card td{padding:11px;border-bottom:1px solid #e6eee9;vertical-align:top}.rp-status{display:inline-block;padding:5px 8px;border-radius:999px;font-weight:900;font-size:11px;background:#e5f6eb;color:#116a39}.rp-status.parcial{background:#fff4d6;color:#856300}.rp-status.nao{background:#fde8e8;color:#a32828}.rp-galeria{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.rp-galeria article{border:1px solid #e0e9e3;border-radius:14px;overflow:hidden;display:grid;background:#fafcfb}.rp-galeria article>b,.rp-galeria article>span{padding:0 12px}.rp-galeria article>b{margin-top:10px}.rp-galeria article>span{padding-bottom:12px;color:#69766f;font-size:12px}.rp-media{aspect-ratio:16/10;background:#e9efeb;display:grid;place-items:center}.rp-media img,.rp-media video{width:100%;height:100%;object-fit:cover}.rp-media-protegida{display:grid;place-items:center;gap:5px;color:#627068;text-align:center}.rp-media-protegida:first-child{font-size:25px}.rp-footer{display:flex;justify-content:space-between;gap:20px;padding:20px 4px 40px;color:#68766f}.rp-footer div{display:grid;gap:3px}.rp-footer b{color:#17432e}
/* RELATORIO PUBLICO - CORRECAO DE CONTRASTE E DIMENSOES */
.rp-shell,.rp-shell *{box-sizing:border-box}
.rp-shell{background:#f2f6f3 !important;color:#173a2a !important}
.rp-page{max-width:1380px !important}
.rp-header h1,.rp-header p,.rp-header small{color:#fff !important}
.rp-kpis article{min-height:118px;display:flex;flex-direction:column;justify-content:center;text-align:center}
.rp-kpis article span,.rp-kpis article small{color:#66776d !important;font-size:14px !important}
.rp-kpis article strong{color:#08713f !important;font-size:32px !important}
.rp-card{color:#18382a !important}
.rp-card .rp-title small{color:#08713f !important;font-size:14px !important;letter-spacing:.5px}
.rp-card .rp-title h2{color:#18382a !important;font-size:25px !important;font-weight:800 !important;opacity:1 !important}
.rp-card .rp-title>span{color:#5d6f65 !important;font-size:16px !important}
.rp-card table{color:#18382a !important;background:#fff !important}
.rp-card th{color:#244b38 !important;background:#eaf4ed !important;font-weight:800 !important}
.rp-card td,.rp-card td b{color:#274a39 !important;opacity:1 !important}
.rp-card td{font-size:13px !important}
.rp-status.ok{background:#dff3e6 !important;color:#08713f !important}
.rp-status.parcial{background:#fff0c9 !important;color:#7a5a00 !important}
.rp-status.nao{background:#fbe1e1 !important;color:#a12222 !important}
.rp-galeria{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(260px,320px)) !important;justify-content:start !important;gap:18px !important}
.rp-galeria article{width:100% !important;max-width:320px !important;background:#fff !important;color:#18382a !important}
.rp-galeria article>b{color:#174b31 !important}
.rp-galeria article>span{color:#68786f !important}
.rp-media{width:100% !important;height:210px !important;aspect-ratio:auto !important;background:#eef3f0 !important}
.rp-media img,.rp-media video{width:100% !important;height:210px !important;max-height:210px !important;object-fit:cover !important;display:block !important}
.rp-media video{background:#101010 !important}
.rp-footer,.rp-footer span,.rp-footer small{color:#66776d !important}
.rp-footer b{color:#174b31 !important}
@media(max-width:850px){
.rp-shell{width:100%!important;max-width:100%!important;padding:8px!important;overflow-x:hidden!important;background:#f2f6f3!important}
.rp-page{width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important}
.rp-header{width:100%!important;display:grid!important;grid-template-columns:1fr!important;justify-items:center!important;gap:14px!important;padding:18px 14px!important;border-radius:16px!important}
.rp-logo-box,.rp-logo-souza,.rp-logo-cliente{width:150px!important;max-width:70%!important;height:100px!important;flex:none!important}
.rp-header-conteudo{width:100%!important;min-width:0!important;text-align:center!important}
.rp-header-conteudo>small{font-size:12px!important}
.rp-header h1{font-size:23px!important;line-height:1.15!important;overflow-wrap:anywhere!important}
.rp-header p{font-size:14px!important;overflow-wrap:anywhere!important}
.rp-header button{width:100%!important}
.rp-kpis{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.rp-kpis article{min-width:0!important;min-height:105px!important;padding:12px 8px!important}
.rp-kpis strong{font-size:28px!important}
.rp-card{width:100%!important;max-width:100%!important;min-width:0!important;padding:14px!important;margin:12px 0!important;overflow:hidden!important}
.rp-title{display:block!important;width:100%!important}
.rp-title h2{font-size:22px!important}
.rp-title>span{display:block!important;margin-top:8px!important;font-size:14px!important}
.rp-table-wrap{width:100%!important;overflow:visible!important}
.rp-card table,.rp-card thead,.rp-card tbody,.rp-card tr,.rp-card th,.rp-card td{display:block!important;width:100%!important}
.rp-card thead{display:none!important}
.rp-card tbody{display:grid!important;gap:12px!important}
.rp-card tr{background:#f8fbf9!important;border:1px solid #dce8e0!important;border-radius:14px!important;padding:10px!important;overflow:hidden!important}
.rp-card td{padding:7px 4px!important;border-bottom:1px solid #e6eee9!important;font-size:14px!important;overflow-wrap:anywhere!important;word-break:break-word!important}
.rp-card td:last-child{border-bottom:0!important}
.rp-galeria{width:100%!important;display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
.rp-galeria article{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
.rp-media{width:100%!important;height:auto!important;aspect-ratio:4/3!important}
.rp-media img,.rp-media video{width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important}
.rp-galeria article>b,.rp-galeria article>span{overflow-wrap:anywhere!important;word-break:break-word!important}
.rp-footer{width:100%!important;flex-direction:column!important}
.relatorio-link-card{align-items:flex-start;flex-direction:column}
}
@media print{.rp-shell{background:#fff;padding:0}.rp-page{max-width:none}.rp-header button{display:none}.rp-card{box-shadow:none;break-inside:avoid}.rp-galeria article{break-inside:avoid}}
`;

export default App;