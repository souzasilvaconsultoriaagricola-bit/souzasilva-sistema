import { useMemo, useState } from 'react'
import JSZip from 'jszip'
import { supabase } from './supabase'

type Auditoria = {
  id: string
  cliente_id: string
  fazenda_id?: string | null
  tipo_auditoria?: string | null
  safra?: string | null
}

type ItemImportacao = {
  id: string
  arquivo: File
  origemPath: string
  categoria: string
  status: 'pronto' | 'enviando' | 'ok' | 'erro'
  erro?: string
}

const MAX_ARQUIVO = 50 * 1024 * 1024

function limparNome(nome: string) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')
}

function categoriaDoArquivo(path: string, nome: string, tipoAuditoria?: string | null) {
  const t = `${path} ${nome}`.toLowerCase()
  if (/fisqp|fispq|fds|ficha.*seguran/.test(t)) return 'FISPQ / FDS'
  if (/analise.*solo|análise.*solo|laudo/.test(t)) return 'Análises de solo e laudos'
  if (/energia|fatura.*energia/.test(t)) return 'Faturas de energia'
  if (/nota.*fiscal|danfe|nfe|nf-e|\.xml$/i.test(t)) return 'Notas Fiscais'
  if (/receitu|receita.*agron/.test(t)) return 'Receituários Agronômicos'
  if (/combust|diesel|gasolina|etanol/.test(t)) return 'Combustíveis'
  if (/fertiliz|adubo|corretivo|insumo/.test(t)) return 'Insumos e fertilizantes'
  if (/evid[eê]ncia|agricola|agrícola/.test(t)) return 'Planilhas e evidências'
  if ((tipoAuditoria || '').toLowerCase().includes('renovabio') && /\.xml$/i.test(nome)) return 'Notas Fiscais'
  return 'Documentação geral'
}

function mimePorNome(nome: string) {
  const ext = nome.split('.').pop()?.toLowerCase()
  const mapa: Record<string, string> = {
    pdf: 'application/pdf', xml: 'application/xml', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', csv: 'text/csv', txt: 'text/plain'
  }
  return (ext && mapa[ext]) || 'application/octet-stream'
}

export default function ImportadorDocumentos({ auditoria, onImportado }: { auditoria: Auditoria; onImportado: () => void | Promise<void> }) {
  const [aberto, setAberto] = useState(false)
  const [itens, setItens] = useState<ItemImportacao[]>([])
  const [lendo, setLendo] = useState(false)
  const [importando, setImportando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const resumo = useMemo(() => {
    const ok = itens.filter(i => i.status === 'ok').length
    const falha = itens.filter(i => i.status === 'erro').length
    const bytes = itens.reduce((s, i) => s + i.arquivo.size, 0)
    return { ok, falha, bytes }
  }, [itens])

  async function transformarSelecao(files: FileList | File[]) {
    setLendo(true); setErro(''); setMensagem('')
    const saida: ItemImportacao[] = []
    try {
      for (const original of Array.from(files)) {
        if (original.name.toLowerCase().endsWith('.zip')) {
          const zip = await JSZip.loadAsync(original)
          for (const [path, entrada] of Object.entries(zip.files)) {
            if (entrada.dir || path.includes('__MACOSX/') || path.split('/').pop()?.startsWith('.')) continue
            const blob = await entrada.async('blob')
            const nome = path.split('/').pop() || 'arquivo'
            const tipo = mimePorNome(nome)
            const arquivo = new File([blob], nome, { type: tipo, lastModified: Date.now() })
            if (arquivo.size > MAX_ARQUIVO) {
              saida.push({ id: crypto.randomUUID(), arquivo, origemPath: path, categoria: categoriaDoArquivo(path, nome, auditoria.tipo_auditoria), status: 'erro', erro: 'Arquivo acima de 50 MB' })
            } else {
              saida.push({ id: crypto.randomUUID(), arquivo, origemPath: path, categoria: categoriaDoArquivo(path, nome, auditoria.tipo_auditoria), status: 'pronto' })
            }
          }
        } else {
          saida.push({ id: crypto.randomUUID(), arquivo: original, origemPath: original.name, categoria: categoriaDoArquivo('', original.name, auditoria.tipo_auditoria), status: original.size > MAX_ARQUIVO ? 'erro' : 'pronto', erro: original.size > MAX_ARQUIVO ? 'Arquivo acima de 50 MB' : undefined })
        }
      }
      setItens(saida)
      if (!saida.length) setErro('Nenhum arquivo válido foi encontrado no pacote.')
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível ler o pacote selecionado.')
    } finally { setLendo(false) }
  }

  function alterarCategoria(id: string, categoria: string) {
    setItens(atual => atual.map(i => i.id === id ? { ...i, categoria } : i))
  }

  async function importar() {
    const pendentes = itens.filter(i => i.status === 'pronto')
    if (!pendentes.length) { setErro('Não há arquivos prontos para importar.'); return }
    setImportando(true); setErro(''); setMensagem('')
    const lote = crypto.randomUUID()
    const { data: userData } = await supabase.auth.getUser()
    let sucessos = 0

    for (const item of pendentes) {
      setItens(atual => atual.map(i => i.id === item.id ? { ...i, status: 'enviando' } : i))
      const nomeSeguro = limparNome(item.arquivo.name)
      const caminho = `${auditoria.cliente_id}/${auditoria.id}/importacoes/${lote}/${crypto.randomUUID()}-${nomeSeguro}`
      const up = await supabase.storage.from('auditorias-documentos').upload(caminho, item.arquivo, { contentType: item.arquivo.type || undefined, upsert: false })
      if (up.error) {
        setItens(atual => atual.map(i => i.id === item.id ? { ...i, status: 'erro', erro: up.error!.message } : i)); continue
      }
      const ins = await supabase.from('auditoria_evidencias').insert({
        requisito_id: null,
        cliente_id: auditoria.cliente_id,
        fazenda_id: auditoria.fazenda_id || null,
        auditoria_id: auditoria.id,
        tipo_evidencia: 'Documento importado',
        nome_arquivo: item.arquivo.name,
        storage_path: caminho,
        mime_type: item.arquivo.type || null,
        tamanho_bytes: item.arquivo.size,
        categoria: item.categoria,
        status: 'ativo',
        origem_path: item.origemPath,
        lote_importacao: lote,
        observacoes: `Importado em lote. Origem: ${item.origemPath}`,
        criado_por: userData.user?.id || null,
      })
      if (ins.error) {
        await supabase.storage.from('auditorias-documentos').remove([caminho])
        setItens(atual => atual.map(i => i.id === item.id ? { ...i, status: 'erro', erro: ins.error!.message } : i)); continue
      }
      sucessos++
      setItens(atual => atual.map(i => i.id === item.id ? { ...i, status: 'ok', erro: undefined } : i))
    }

    setImportando(false)
    if (sucessos) {
      setMensagem(`${sucessos} arquivo(s) importado(s) com sucesso.`)
      await onImportado()
    }
  }

  return <>
    <button type="button" className="botao-secundario" onClick={() => setAberto(true)}>⬆ Importar documentos</button>
    {aberto && <div className="imp-overlay">
      <div className="imp-modal">
        <div className="imp-head"><div><span>ARQUIVO DIGITAL</span><h2>Importar pacote de documentos</h2><p>{auditoria.tipo_auditoria || 'Auditoria'} • {auditoria.safra || 'Safra não informada'}</p></div><button type="button" onClick={() => !importando && setAberto(false)}>×</button></div>
        <label className="imp-drop"><strong>{lendo ? 'Lendo pacote...' : 'Selecionar ZIP ou vários arquivos'}</strong><span>PDF, XML, Excel, Word, imagens e outros documentos • até 50 MB por arquivo</span><input type="file" multiple accept=".zip,.pdf,.xml,.xlsx,.xls,.doc,.docx,.csv,.txt,.jpg,.jpeg,.png" disabled={lendo || importando} onChange={e => { if (e.target.files?.length) transformarSelecao(e.target.files); e.currentTarget.value = '' }} /></label>
        {erro && <div className="imp-erro">{erro}</div>}{mensagem && <div className="imp-ok">✓ {mensagem}</div>}
        {!!itens.length && <><div className="imp-resumo"><b>{itens.length} arquivos</b><span>{(resumo.bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB</span><span>{resumo.ok} importados</span>{resumo.falha > 0 && <span>{resumo.falha} com erro</span>}</div>
          <div className="imp-lista">{itens.map(item => <div className={`imp-item s-${item.status}`} key={item.id}><div><strong>{item.arquivo.name}</strong><small>{item.origemPath}</small>{item.erro && <em>{item.erro}</em>}</div><select value={item.categoria} disabled={importando || item.status === 'ok'} onChange={e => alterarCategoria(item.id, e.target.value)}><option>Documentação geral</option><option>Planilhas e evidências</option><option>FISPQ / FDS</option><option>Análises de solo e laudos</option><option>Faturas de energia</option><option>Notas Fiscais</option><option>Receituários Agronômicos</option><option>Combustíveis</option><option>Insumos e fertilizantes</option></select><b>{item.status === 'pronto' ? 'Pronto' : item.status === 'enviando' ? 'Enviando...' : item.status === 'ok' ? '✓' : '!'}</b></div>)}</div>
        </>}
        <div className="imp-actions"><button type="button" className="botao-secundario" disabled={importando} onClick={() => setAberto(false)}>Fechar</button><button type="button" className="botao-verde" disabled={importando || !itens.some(i => i.status === 'pronto')} onClick={importar}>{importando ? 'Importando...' : 'Importar arquivos'}</button></div>
      </div>
    </div>}
    <style>{`
      .imp-overlay{position:fixed;inset:0;z-index:9999;background:rgba(3,22,16,.72);display:grid;place-items:center;padding:24px}.imp-modal{width:min(980px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 30px 80px #0006;color:#173f33}.imp-head{display:flex;justify-content:space-between;gap:20px}.imp-head span{font-size:8px;font-weight:900;letter-spacing:1.3px;color:#27805a}.imp-head h2{margin:5px 0;font-size:22px}.imp-head p{margin:0;color:#7c9085;font-size:10px}.imp-head>button{width:36px;height:36px;border:0;border-radius:9px;background:#eef4f0;color:#35634f;font-size:20px}.imp-drop{margin-top:18px;min-height:105px;border:2px dashed #a9c9b6;border-radius:14px;background:#f6faf7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;cursor:pointer}.imp-drop strong{font-size:13px;color:#267d58}.imp-drop span{font-size:9px;color:#7f9188}.imp-drop input{display:none}.imp-erro,.imp-ok{margin-top:10px;padding:10px 12px;border-radius:9px;font-size:10px;font-weight:800}.imp-erro{background:#fff1f1;color:#a63f3f}.imp-ok{background:#eaf7ee;color:#267d58}.imp-resumo{margin-top:13px;display:flex;gap:14px;align-items:center;padding:10px 12px;background:#0c3f31;color:#fff;border-radius:10px;font-size:9px}.imp-lista{margin-top:9px;border:1px solid #e0e8e3;border-radius:11px;overflow:hidden}.imp-item{display:grid;grid-template-columns:minmax(0,1fr) 210px 55px;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #e8eee9}.imp-item:first-child{border-top:0}.imp-item>div{min-width:0}.imp-item strong,.imp-item small,.imp-item em{display:block;overflow-wrap:anywhere}.imp-item strong{font-size:9px}.imp-item small{margin-top:3px;font-size:7px;color:#83968c}.imp-item em{margin-top:3px;font-size:7px;color:#b13e3e}.imp-item select{height:32px;border:1px solid #d8e4dc;border-radius:8px;background:#fff;font-size:8px}.imp-item>b{text-align:center;font-size:9px;color:#55786a}.imp-item.s-ok{background:#f0faf3}.imp-item.s-erro{background:#fff5f5}.imp-actions{margin-top:16px;display:flex;justify-content:flex-end;gap:9px}@media(max-width:700px){.imp-item{grid-template-columns:1fr}.imp-item select{width:100%}.imp-resumo{flex-wrap:wrap}}
    `}</style>
  </>
}
