import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';

type Registro = Record<string, any>;

function texto(v: any) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function numero(v: any) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const t = texto(v).replace(/\s/g, '').replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function ImportadorBonsucro({ auditoria }: Props) {
  const [indicadores, setIndicadores] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const ehBonsucro = texto(auditoria?.tipo_auditoria)
    .toLowerCase()
    .includes('bonsucro');

  async function carregar() {
    if (!auditoria?.id || !ehBonsucro) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from('auditoria_indicadores')
      .select('*')
      .eq('auditoria_id', auditoria.id)
      .order('ordem', { ascending: true });
    if (error) setErro(error.message);
    else setIndicadores(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, [auditoria?.id]);

  async function importarExcel(arquivo: File) {
    setErro('');
    setMensagem('');
    if (!/\.xlsx?$/i.test(arquivo.name)) {
      setErro('Selecione a planilha Excel Bonsucro (.xlsx ou .xls).');
      return;
    }
    setImportando(true);
    try {
      const buffer = await arquivo.arrayBuffer();
      const livro = XLSX.read(buffer, { type: 'array', cellDates: true });
      const nomeAba =
        livro.SheetNames.find((n) => n.trim().toLowerCase() === 'agrícola') ||
        livro.SheetNames.find((n) => n.trim().toLowerCase() === 'agricola');
      if (!nomeAba)
        throw new Error('A aba Agrícola não foi encontrada nesta planilha.');

      const linhas = XLSX.utils.sheet_to_json<any[]>(livro.Sheets[nomeAba], {
        header: 1,
        defval: '',
        raw: false,
      });
      if (linhas.length < 2) throw new Error('A aba Agrícola está vazia.');

      const cab = linhas[0].map((x: any) => texto(x).toLowerCase());
      const idx = (nomes: string[]) =>
        cab.findIndex((h: string) =>
          nomes.some((n) => h === n || h.includes(n))
        );
      const iRef = idx(['indicator reference']);
      const iDesc = idx(['agriculture']);
      const iInput = idx(['input']);
      const iUnit = idx(['verifier (unit)', 'verifier']);
      const iComments = idx(['comments']);
      const iGuidance = idx(['guidance']);
      const iTotal = idx(['total production']);
      const iCert = idx(['certifiable production']);
      if (iDesc < 0 || iInput < 0)
        throw new Error('Não reconheci as colunas principais da aba Agrícola.');

      const registros = linhas
        .slice(1)
        .map((r: any[], pos: number) => {
          const descricao = texto(r[iDesc]);
          const valor = r[iInput];
          return {
            auditoria_id: auditoria.id,
            indicador_referencia: iRef >= 0 ? texto(r[iRef]) || null : null,
            descricao,
            valor_texto: texto(valor) || null,
            valor_numerico: numero(valor),
            unidade: iUnit >= 0 ? texto(r[iUnit]) || null : null,
            comentarios: iComments >= 0 ? texto(r[iComments]) || null : null,
            orientacao: iGuidance >= 0 ? texto(r[iGuidance]) || null : null,
            producao_total: iTotal >= 0 ? texto(r[iTotal]) || null : null,
            producao_certificavel: iCert >= 0 ? texto(r[iCert]) || null : null,
            aba_origem: nomeAba,
            ordem: pos + 1,
            status: texto(valor) ? 'Preenchido' : 'Pendente',
            atualizado_em: new Date().toISOString(),
          };
        })
        .filter((x: any) => x.descricao);

      if (!registros.length)
        throw new Error('Nenhum indicador foi encontrado na aba Agrícola.');

      const { data: atuais, error: erroAtuais } = await supabase
        .from('auditoria_indicadores')
        .select('id,indicador_referencia,descricao')
        .eq('auditoria_id', auditoria.id);
      if (erroAtuais) throw erroAtuais;

      let novos = 0,
        atualizados = 0;
      for (const reg of registros) {
        const existente = (atuais ?? []).find(
          (x: any) =>
            texto(x.indicador_referencia) === texto(reg.indicador_referencia) &&
            texto(x.descricao).toLowerCase() ===
              texto(reg.descricao).toLowerCase()
        );
        if (existente) {
          const { error } = await supabase
            .from('auditoria_indicadores')
            .update(reg)
            .eq('id', existente.id);
          if (error) throw error;
          atualizados++;
        } else {
          const { error } = await supabase
            .from('auditoria_indicadores')
            .insert(reg);
          if (error) throw error;
          novos++;
        }
      }

      setMensagem(
        `Planilha Bonsucro processada: ${registros.length} indicadores (${novos} novos e ${atualizados} atualizados).`
      );
      await carregar();
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível importar a planilha Bonsucro.');
    } finally {
      setImportando(false);
    }
  }

  const preenchidos = useMemo(
    () => indicadores.filter((x) => x.status === 'Preenchido').length,
    [indicadores]
  );
  if (!ehBonsucro) return null;

  return (
    <section className="painel" style={{ marginTop: 16 }}>
      <div className="titulo">
        <div>
          <span>BONSUCrO • DADOS DA PLANILHA</span>
          <h2>Indicadores Agrícolas</h2>
          <p>
            Importação direta da aba Agrícola, preservando referência, valor,
            unidade, comentários e orientação.
          </p>
        </div>
        <label
          className="botao-verde"
          style={{ cursor: importando ? 'wait' : 'pointer' }}
        >
          {importando
            ? 'Importando...'
            : indicadores.length
            ? '↻ Atualizar Excel'
            : '＋ Importar Excel'}
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={importando}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importarExcel(f);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {erro && <div className="erro-box">{erro}</div>}
      {mensagem && <div className="aud-sucesso">✓ {mensagem}</div>}

      <div className="aud-kpis" style={{ marginBottom: 16 }}>
        <div>
          <span>INDICADORES</span>
          <strong>{indicadores.length}</strong>
        </div>
        <div>
          <span>PREENCHIDOS</span>
          <strong>{preenchidos}</strong>
        </div>
        <div>
          <span>PENDENTES</span>
          <strong>{indicadores.length - preenchidos}</strong>
        </div>
        <div>
          <span>ABA DE ORIGEM</span>
          <strong style={{ fontSize: 18 }}>Agrícola</strong>
        </div>
      </div>

      {carregando ? (
        <p>Carregando indicadores...</p>
      ) : indicadores.length ? (
        <div className="tabela-wrap">
          <table>
            <thead>
              <tr>
                <th>REF.</th>
                <th>INDICADOR</th>
                <th>VALOR</th>
                <th>UNIDADE</th>
                <th>COMENTÁRIOS</th>
                <th>ORIENTAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.indicador_referencia || '—'}</strong>
                  </td>
                  <td>{x.descricao}</td>
                  <td>
                    <strong>{x.valor_texto || '—'}</strong>
                  </td>
                  <td>{x.unidade || '—'}</td>
                  <td style={{ minWidth: 220, whiteSpace: 'normal' }}>
                    {x.comentarios || '—'}
                  </td>
                  <td style={{ minWidth: 260, whiteSpace: 'normal' }}>
                    {x.orientacao || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vazio">
          <div className="check">↥</div>
          <h3>Planilha Bonsucro ainda não importada</h3>
          <p>
            Clique em “Importar Excel” e selecione o arquivo Agrícola 2526
            Bonsucro evidências.xlsx.
          </p>
        </div>
      )}
    </section>
  );
}
