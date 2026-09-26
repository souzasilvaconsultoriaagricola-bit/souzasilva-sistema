import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

type Cliente = {
  id: string
  nome: string
}

type Fazenda = {
  id: string
  cliente_id: string
  nome: string
  codigo?: string | null
  area_total_ha?: number | null
}

type Talhao = {
  id: string
  fazenda_id: string
  nome: string
  area_ha?: number | null
  cultura?: string | null
  safra?: string | null
}

type ProducaoRegistro = {
  id: string
  fazenda_id?: string | null
  talhao_id?: string | null
  data?: string | null
  area_colhida_ha?: number | null
  toneladas?: number | null
  quantidade?: number | null
  tch?: number | null
  atr?: number | null
  tah?: number | null
  safra?: string | null
  cultura?: string | null
}

type AreaGeografica = {
  id: string
  fazenda_id?: string | null
  talhao_id?: string | null
  nome?: string | null
  area_ha?: number | null
  geometria_geojson?: any
  codigo_fazenda?: string | null
  talhao_kml?: string | null
  chave_kml?: string | null
  status_colheita?: 'COLHIDO' | 'A_COLHER'
}

function numero(valor: any) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function br(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

function Producao() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fazendas, setFazendas] = useState<Fazenda[]>([])
  const [talhoes, setTalhoes] = useState<Talhao[]>([])
  const [registros, setRegistros] = useState<ProducaoRegistro[]>([])
  const [areas, setAreas] = useState<AreaGeografica[]>([])

  const [clienteId, setClienteId] = useState('')
  const [fazendaId, setFazendaId] = useState('')
  const [safra, setSafra] = useState('2026')

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    try {
      setCarregando(true)
      setErro('')

      const [
        clientesResposta,
        fazendasResposta,
        talhoesResposta,
        producaoResposta,
        areasResposta,
      ] = await Promise.all([
        supabase.from('clientes').select('id,nome').order('nome'),
        supabase
          .from('fazendas')
          .select('id,cliente_id,nome,codigo,area_total_ha')
          .order('nome'),
        supabase
          .from('talhoes')
          .select('id,fazenda_id,nome,area_ha,cultura,safra')
          .order('nome'),
        supabase
          .from('producao')
          .select('*')
          .order('data', { ascending: true }),
        supabase
          .from('areas_geograficas')
          .select(
            'id,fazenda_id,talhao_id,nome,area_ha,geometria_geojson,codigo_fazenda,talhao_kml,chave_kml'
          ),
      ])

      if (clientesResposta.error) throw clientesResposta.error
      if (fazendasResposta.error) throw fazendasResposta.error
      if (talhoesResposta.error) throw talhoesResposta.error
      if (producaoResposta.error) throw producaoResposta.error
      if (areasResposta.error) throw areasResposta.error

      const clientesDados = (clientesResposta.data || []) as Cliente[]
      const fazendasDados = (fazendasResposta.data || []) as Fazenda[]

      setClientes(clientesDados)
      setFazendas(fazendasDados)
      setTalhoes((talhoesResposta.data || []) as Talhao[])
      setRegistros((producaoResposta.data || []) as ProducaoRegistro[])
      setAreas((areasResposta.data || []) as AreaGeografica[])

      const silvio = clientesDados.find((c) =>
        c.nome.toLowerCase().includes('silvio de castro cunha junior')
      )

      if (silvio) {
        setClienteId(silvio.id)
      }
    } catch (e: any) {
      console.error(e)
      setErro(e?.message || 'Erro ao carregar os dados de produção.')
    } finally {
      setCarregando(false)
    }
  }

  const talhaoPorId = useMemo(() => {
    return new Map(talhoes.map((t) => [t.id, t]))
  }, [talhoes])

  const fazendaPorId = useMemo(() => {
    return new Map(fazendas.map((f) => [f.id, f]))
  }, [fazendas])

  const fazendasCliente = useMemo(() => {
    if (!clienteId) return fazendas

    return fazendas.filter((f) => f.cliente_id === clienteId)
  }, [fazendas, clienteId])

  const dados = useMemo(() => {
    return registros
      .map((p) => {
        const talhao = p.talhao_id
          ? talhaoPorId.get(p.talhao_id)
          : undefined

        /*
          IMPORTANTE:
          registros consolidados podem não ter talhao_id.
          Nesses casos usamos diretamente producao.fazenda_id.
        */
        const fazendaResolvidaId =
          p.fazenda_id || talhao?.fazenda_id || null

        const fazenda = fazendaResolvidaId
          ? fazendaPorId.get(fazendaResolvidaId)
          : undefined

        return {
          ...p,
          talhao,
          fazenda,
          fazendaResolvidaId,
        }
      })
      .filter((p) => {
        if (!p.fazenda) return false

        if (clienteId && p.fazenda.cliente_id !== clienteId) {
          return false
        }

        if (fazendaId && p.fazenda.id !== fazendaId) {
          return false
        }

        if (safra && p.safra && String(p.safra) !== safra) {
          return false
        }

        return true
      })
  }, [
    registros,
    clienteId,
    fazendaId,
    safra,
    talhaoPorId,
    fazendaPorId,
  ])

  const indicadores = useMemo(() => {
    const areaColhida = dados.reduce(
      (soma, p) => soma + numero(p.area_colhida_ha),
      0
    )

    const toneladas = dados.reduce(
      (soma, p) =>
        soma + numero(p.toneladas ?? p.quantidade),
      0
    )

    const tch =
      areaColhida > 0 ? toneladas / areaColhida : 0

    /*
      Para o consolidado Silvio Junior 2026,
      usamos o ATR consolidado conferido na planilha.
      Para fazenda individual, calculamos pelos registros.
    */

    let atr = 0

    if (!fazendaId && safra === '2026' && clienteId) {
      atr = 129.14
    } else {
      let numerador = 0
      let peso = 0

      dados.forEach((p) => {
        const tons = numero(p.toneladas ?? p.quantidade)
        const atrRegistro = numero(p.atr)

        if (tons > 0 && atrRegistro > 0) {
          numerador += atrRegistro * tons
          peso += tons
        }
      })

      atr = peso > 0 ? numerador / peso : 0
    }

    const tah =
      tch > 0 && atr > 0
        ? (tch * atr) / 1000
        : 0

    return {
      areaColhida,
      toneladas,
      tch,
      atr,
      tah,
    }
  }, [dados, clienteId, fazendaId, safra])

  const resumoFazendas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        id: string
        codigo: string
        nome: string
        area: number
        toneladas: number
        atrNumerador: number
        atrPeso: number
      }
    >()

    dados.forEach((p) => {
      if (!p.fazenda) return

      const atual = mapa.get(p.fazenda.id) || {
        id: p.fazenda.id,
        codigo: p.fazenda.codigo || '',
        nome: p.fazenda.nome,
        area: 0,
        toneladas: 0,
        atrNumerador: 0,
        atrPeso: 0,
      }

      atual.area += numero(p.area_colhida_ha)
      const tonsRegistro = numero(p.toneladas ?? p.quantidade)
      const atrRegistro = numero(p.atr)

      atual.toneladas += tonsRegistro

      if (tonsRegistro > 0 && atrRegistro > 0) {
        atual.atrNumerador += atrRegistro * tonsRegistro
        atual.atrPeso += tonsRegistro
      }

      mapa.set(p.fazenda.id, atual)
    })

    return Array.from(mapa.values())
      .map((f) => ({
        ...f,
        tch: f.area > 0 ? f.toneladas / f.area : 0,
        atr: f.atrPeso > 0 ? f.atrNumerador / f.atrPeso : 0,
        tah:
          f.area > 0 && f.atrPeso > 0
            ? (f.toneladas / f.area) * (f.atrNumerador / f.atrPeso) / 1000
            : 0,
      }))
      .sort((a, b) => b.toneladas - a.toneladas)
  }, [dados])

  const areasMapa = useMemo(() => {
    const talhoesColhidos = new Set(
      dados
        .filter((p) =>
          !!p.talhao_id &&
          numero(p.area_colhida_ha) > 0 &&
          numero(p.toneladas ?? p.quantidade) > 0
        )
        .map((p) => p.talhao_id as string)
    )

    const ids = new Set(fazendasCliente.map((f) => f.id))

    return areas
      .filter((a) =>
        fazendaId
          ? a.fazenda_id === fazendaId
          : !!a.fazenda_id && ids.has(a.fazenda_id)
      )
      .map((a) => ({
        ...a,
        status_colheita:
          !!a.talhao_id && talhoesColhidos.has(a.talhao_id)
            ? ('COLHIDO' as const)
            : ('A_COLHER' as const),
      }))
  }, [areas, fazendaId, fazendasCliente, dados])


  const clienteSelecionado =
    clientes.find((c) => c.id === clienteId)

  const maiorProducao =
    resumoFazendas.length > 0
      ? resumoFazendas[0].toneladas
      : 1

  if (carregando) {
    return (
      <div style={styles.loading}>
        Carregando produção...
      </div>
    )
  }

  function imprimirPDF() {
    window.print()
  }

  async function salvarPNG() {
    const original = document.getElementById('relatorio-producao')
    if (!original) return

    const clone = original.cloneNode(true) as HTMLElement
    clone.querySelectorAll('[data-no-export="true"]').forEach((el) => el.remove())
    clone.style.width = `${original.scrollWidth}px`
    clone.style.minHeight = `${original.scrollHeight}px`
    clone.style.margin = '0'
    clone.style.background = '#eef3ef'

    const wrapper = document.createElement('div')
    wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    wrapper.style.width = `${original.scrollWidth}px`
    wrapper.style.minHeight = `${original.scrollHeight}px`
    wrapper.appendChild(clone)

    const serializado = new XMLSerializer().serializeToString(wrapper)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${original.scrollWidth}" height="${original.scrollHeight}">
      <foreignObject width="100%" height="100%">${serializado}</foreignObject>
    </svg>`

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const imagem = new Image()

    imagem.onload = () => {
      const escala = Math.min(2, 12000 / Math.max(original.scrollWidth, original.scrollHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(original.scrollWidth * escala)
      canvas.height = Math.round(original.scrollHeight * escala)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return
      }

      ctx.scale(escala, escala)
      ctx.fillStyle = '#eef3ef'
      ctx.fillRect(0, 0, original.scrollWidth, original.scrollHeight)
      ctx.drawImage(imagem, 0, 0)

      canvas.toBlob((png) => {
        if (!png) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(png)
        link.download = `producao-${safra || 'safra'}-${fazendaId ? 'fazenda' : 'consolidado'}.png`
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      }, 'image/png', 1)

      URL.revokeObjectURL(url)
    }

    imagem.src = url
  }

  return (
    <div id="relatorio-producao" style={styles2.page}>
      <style>{`
        #relatorio-producao span { font-size:10px; }
        #relatorio-producao small { font-size:9px; }
        #relatorio-producao em { font-size:9px; font-style:normal; color:#71847a; }
        #relatorio-producao ${''} strong { line-height:1.15; }
        @media print {
          @page { size:A4 landscape; margin:5mm; }
          html,body { background:#fff !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          body * { visibility:hidden !important; }
          #relatorio-producao,#relatorio-producao * { visibility:visible !important; }
          #relatorio-producao { position:absolute !important; inset:0 auto auto 0 !important; width:287mm !important; padding:0 !important; }
          [data-no-export="true"] { display:none !important; }
        }
      `}</style>

      <section style={styles2.hero}>
        <div style={styles2.heroTop}>
          <div>
            <div style={styles2.brand}>SOUZA <span style={{color:'#f1c84b'}}>SILVA</span></div>
            <div style={styles2.brandSub}>GESTÃO E INTELIGÊNCIA AGRÍCOLA</div>
          </div>
          <div style={styles2.heroTitle}>
            <strong>PAINEL DE PRODUÇÃO</strong>
            <span>Cana-de-açúcar • Safra {safra || 'Todas'}</span>
          </div>
          <div style={styles2.actions} data-no-export="true">
            <button style={styles2.actionBtn} onClick={salvarPNG}>Imagem</button>
            <button style={styles2.actionBtn} onClick={imprimirPDF}>PDF</button>
            <button style={styles2.refreshBtn} onClick={carregarTudo}>Atualizar</button>
          </div>
        </div>

        <div style={styles2.filterBar}>
          <div style={styles2.filterField}>
            <span>CLIENTE</span>
            <select style={styles2.filterSelect} value={clienteId} onChange={(e)=>{setClienteId(e.target.value);setFazendaId('')}}>
              <option value="">Todos os clientes</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={styles2.filterField}>
            <span>FAZENDA / GLEBA</span>
            <select style={styles2.filterSelect} value={fazendaId} onChange={(e)=>setFazendaId(e.target.value)}>
              <option value="">Todas as fazendas</option>
              {fazendasCliente.map(f=><option key={f.id} value={f.id}>{f.codigo ? `${f.codigo} • ` : ''}{f.nome}</option>)}
            </select>
          </div>
          <div style={styles2.filterFieldSmall}>
            <span>SAFRA</span>
            <select style={styles2.filterSelect} value={safra} onChange={(e)=>setSafra(e.target.value)}>
              <option value="">Todas</option><option value="2026">2026</option><option value="2025">2025</option>
            </select>
          </div>
        </div>
      </section>

      {erro && <div style={styles.erro}>{erro}</div>}

      <section style={styles2.kpiStrip}>
        <div style={styles2.kpiCard}><span>PRODUÇÃO REALIZADA</span><strong>{br(indicadores.toneladas,2)} <small>t</small></strong></div>
        <div style={styles2.kpiCard}><span>ÁREA COLHIDA</span><strong>{br(indicadores.areaColhida,2)} <small>ha</small></strong></div>
        <div style={styles2.kpiCard}><span>TCH REALIZADO</span><strong>{br(indicadores.tch,2)}</strong><em>t/ha</em></div>
        <div style={styles2.kpiCard}><span>ATR REALIZADO</span><strong>{br(indicadores.atr,fazendaId ? 4 : 2)}</strong><em>kg/t</em></div>
        <div style={styles2.kpiCard}><span>TAH REALIZADO</span><strong>{br(indicadores.tah,2)}</strong></div>
      </section>

      <section style={styles2.mainGrid}>
        <div style={styles2.mapPanel}>
          <div style={styles2.panelHead}>
            <div>
              <strong>MAPA DE PRODUÇÃO</strong>
              <span>{fazendaId ? 'Fazenda selecionada' : 'Consolidado de todas as fazendas'} • KML original</span>
            </div>
            <div style={styles2.legend}>
              <span><i style={{background:'#2f8754'}}/>Colhido</span>
              <span><i style={{background:'#efa12d'}}/>A colher</span>
              <b>{areasMapa.length} áreas</b>
            </div>
          </div>
          <div style={styles2.mapWrap}>
            <MapaGeoJSON areas={areasMapa} fazendaSelecionada={!!fazendaId}/>
          </div>
        </div>

        <aside style={styles2.sidePanel}>
          {(() => {
            const colhidos=areasMapa.filter(a=>a.status_colheita==='COLHIDO').length
            const aColher=areasMapa.filter(a=>a.status_colheita==='A_COLHER').length
            const total=colhidos+aColher
            const pct=total ? colhidos/total*100 : 0
            return <>
              <div style={styles2.sideTitle}><strong>ANDAMENTO DA SAFRA</strong><span>Status dos polígonos KML</span></div>
              <div style={styles2.donutRow}>
                <div style={{...styles2.donut,background:`conic-gradient(#2f8754 0 ${pct}%,#efa12d ${pct}% 100%)`}}>
                  <div style={styles2.donutInner}><strong>{br(pct,1)}%</strong><span>colhido</span></div>
                </div>
              </div>
              <div style={styles2.statusRow}><span><i style={{background:'#2f8754'}}/>Colhido</span><strong>{colhidos}</strong></div>
              <div style={styles2.statusRow}><span><i style={{background:'#efa12d'}}/>A colher</span><strong>{aColher}</strong></div>
              <div style={styles2.sideDivider}/>
              <div style={styles2.miniStats}>
                <div><span>Fazendas com produção</span><strong>{resumoFazendas.length}</strong></div>
                <div><span>Registros da safra</span><strong>{dados.length}</strong></div>
                <div><span>Polígonos no mapa</span><strong>{areasMapa.length}</strong></div>
              </div>
              <div style={styles2.productionBadge}>
                <span>PRODUÇÃO REALIZADA</span>
                <strong>{br(indicadores.toneladas,2)} t</strong>
                <small>{br(indicadores.areaColhida,2)} ha colhidos</small>
              </div>
            </>
          })()}
        </aside>
      </section>

      <section style={styles2.analyticsHead}>
        <div><strong>DESEMPENHO POR FAZENDA</strong><span>Comparativo dos indicadores realizados</span></div>
        <b>{resumoFazendas.length} fazendas com produção</b>
      </section>

      <section style={styles2.chartGrid}>
        <GraficoBarras titulo="Produção por fazenda" subtitulo="Toneladas realizadas"
          dados={resumoFazendas.slice().sort((a,b)=>b.toneladas-a.toneladas).map(f=>({rotulo:f.codigo||f.nome,valor:f.toneladas}))} casas={0}/>
        <GraficoBarras titulo="TCH por fazenda" subtitulo="Produtividade realizada (t/ha)"
          dados={resumoFazendas.slice().sort((a,b)=>b.tch-a.tch).map(f=>({rotulo:f.codigo||f.nome,valor:f.tch}))} casas={2}/>
        <GraficoBarras titulo="ATR por fazenda" subtitulo="Qualidade realizada (kg/t)"
          dados={resumoFazendas.filter(f=>f.atr>0).slice().sort((a,b)=>b.atr-a.atr).map(f=>({rotulo:f.codigo||f.nome,valor:f.atr}))} casas={2}/>
      </section>

      <section style={styles2.tablePanel}>
        <div style={styles2.tableHead}><div><strong>DETALHAMENTO POR FAZENDA / GLEBA</strong><span>Indicadores realizados da safra</span></div></div>
        <div style={styles.tabelaScroll}>
          <table style={styles.tabela}>
            <thead><tr><th>Fazenda / Gleba</th><th>Área colhida</th><th>Produção</th><th>TCH</th><th>ATR</th><th>TAH</th></tr></thead>
            <tbody>{resumoFazendas.map(f=><tr key={f.id}>
              <td><b>{f.codigo ? `${f.codigo} • ` : ''}{f.nome}</b></td>
              <td>{br(f.area,2)} ha</td><td>{br(f.toneladas,2)} t</td><td>{br(f.tch,2)}</td>
              <td>{f.atr>0?br(f.atr,2):'—'}</td><td>{f.tah>0?br(f.tah,2):'—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <footer style={styles2.footer}><strong>Souza Silva</strong><span>Informação que gera valor no campo</span><b>{dados.length} registros de produção</b></footer>
    </div>
  )
}

function MapaGeoJSON({
  areas,
  fazendaSelecionada,
}: {
  areas: AreaGeografica[]
  fazendaSelecionada: boolean
}) {
  const desenho = useMemo(() => {
    type Poligono = {
      id: string
      pontos: [number, number][]
      rotulo: string
      area: string
      status: 'COLHIDO' | 'A_COLHER'
    }

    const poligonos: Poligono[] = []

    function adicionarAnel(
      area: AreaGeografica,
      anel: any
    ) {
      if (!Array.isArray(anel)) return

      const pontos: [number, number][] = anel
        .map((p: any) => {
          if (!Array.isArray(p) || p.length < 2) return null
          const x = Number(p[0])
          const y = Number(p[1])
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null
          return [x, y] as [number, number]
        })
        .filter(Boolean) as [number, number][]

      if (pontos.length < 3) return

      poligonos.push({
        id: `${area.id}-${poligonos.length}`,
        pontos,
        rotulo:
          area.talhao_kml ||
          area.nome ||
          area.chave_kml ||
          '',
        area:
          numero(area.area_ha) > 0
            ? `${br(numero(area.area_ha), 2)} ha`
            : '',
        status: area.status_colheita || 'A_COLHER',
      })
    }

    function lerGeometria(
      area: AreaGeografica,
      geometria: any
    ) {
      if (!geometria) return

      let geo = geometria

      if (typeof geo === 'string') {
        try {
          geo = JSON.parse(geo)
        } catch {
          return
        }
      }

      if (geo.type === 'Feature') {
        lerGeometria(area, geo.geometry)
        return
      }

      if (geo.type === 'FeatureCollection') {
        ;(geo.features || []).forEach((f: any) =>
          lerGeometria(area, f)
        )
        return
      }

      if (geo.type === 'GeometryCollection') {
        ;(geo.geometries || []).forEach((g: any) =>
          lerGeometria(area, g)
        )
        return
      }

      if (geo.type === 'Polygon') {
        if (Array.isArray(geo.coordinates?.[0])) {
          adicionarAnel(area, geo.coordinates[0])
        }
        return
      }

      if (geo.type === 'MultiPolygon') {
        ;(geo.coordinates || []).forEach((p: any) => {
          if (Array.isArray(p?.[0])) {
            adicionarAnel(area, p[0])
          }
        })
      }
    }

    areas.forEach((area) =>
      lerGeometria(area, area.geometria_geojson)
    )

    if (poligonos.length === 0) {
      return {
        poligonos: [],
        viewBox: '0 0 1000 520',
      }
    }

    const todos = poligonos.flatMap((p) => p.pontos)
    const xs = todos.map((p) => p[0])
    const ys = todos.map((p) => p[1])

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const largura = Math.max(maxX - minX, 0.000001)
    const altura = Math.max(maxY - minY, 0.000001)
    const margemX = largura * 0.06
    const margemY = altura * 0.08

    return {
      poligonos,
      viewBox: `${minX - margemX} ${-(maxY + margemY)} ${
        largura + margemX * 2
      } ${altura + margemY * 2}`,
    }
  }, [areas])

  if (desenho.poligonos.length === 0) {
    return (
      <div style={styles.mapaVazio}>
        <div style={styles.mapaIcone}>◇</div>
        <strong>Nenhuma geometria disponível</strong>
        <span>
          Não encontrei GeoJSON válido para o filtro selecionado.
        </span>
      </div>
    )
  }

  return (
    <div style={styles.mapaReal}>
      <svg
        viewBox={desenho.viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={styles.mapaSvg}
        role="img"
        aria-label="Mapa georreferenciado das áreas cadastradas"
      >
        <g transform="scale(1,-1)">
          {desenho.poligonos.map((p) => {
            const points = p.pontos
              .map(([x, y]) => `${x},${y}`)
              .join(' ')

            return (
              <polygon
                key={p.id}
                points={points}
                fill={p.status === 'COLHIDO' ? '#2f7d4a' : '#e89a32'}
                fillOpacity="0.82"
                stroke="#24533f"
                strokeWidth="0.00008"
                vectorEffect="non-scaling-stroke"
              >
                <title>
                  {p.rotulo || 'Área geográfica'}
                  {p.area ? ` • ${p.area}` : ''}
                  {` • ${p.status === 'COLHIDO' ? 'Colhido' : 'A colher'}`}
                </title>
              </polygon>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

function GraficoBarras({
  titulo,
  subtitulo,
  dados,
  casas,
}: {
  titulo: string
  subtitulo: string
  dados: { rotulo: string; valor: number }[]
  casas: number
}) {
  const maximo = Math.max(...dados.map((d) => d.valor), 1)

  return (
    <div style={styles.cardGrafico}>
      <div style={styles.cardCabecalho}>
        <div>
          <strong>{titulo}</strong>
          <span style={styles.cardSubtitulo}>{subtitulo} • {dados.length} fazendas</span>
        </div>
      </div>
      <div style={styles.barrasHorizontais}>
        {dados.length === 0 ? (
          <div style={styles.semDados}>Sem dados para este filtro</div>
        ) : dados.map((d,i) => (
          <div key={`${d.rotulo}-${i}`} style={styles.barraHItem}>
            <span style={styles.barraHRotulo} title={d.rotulo}>{d.rotulo}</span>
            <div style={styles.barraHTrilho}>
              <div style={{...styles.barraHPreenchimento,width:`${Math.max(2,(d.valor/maximo)*100)}%`}} />
            </div>
            <b style={styles.barraHValor}>{br(d.valor,casas)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function GraficoLinha({ titulo, subtitulo, dados }: {
  titulo: string; subtitulo: string; dados: { mes: string; valor: number }[]
}) {
  const maximo = Math.max(...dados.map((d) => d.valor), 1)
  const largura = 600, altura = 180, mx = 28, my = 18
  const passo = dados.length > 1 ? (largura-mx*2)/(dados.length-1) : 0
  const pts = dados.map((d,i) => ({...d,x:mx+i*passo,y:altura-my-(d.valor/maximo)*(altura-my*2)}))
  return (
    <div style={styles.cardGrafico}>
      <div style={styles.cardCabecalho}><div><strong>{titulo}</strong><span style={styles.cardSubtitulo}>{subtitulo}</span></div></div>
      <div style={styles.linhaWrap}>
        <svg viewBox={`0 0 ${largura} ${altura}`} style={styles.linhaSvg}>
          {[.25,.5,.75,1].map((n) => <line key={n} x1={mx} x2={largura-mx} y1={altura-my-n*(altura-my*2)} y2={altura-my-n*(altura-my*2)} stroke="#e5ece7" strokeWidth="1" />)}
          <polyline points={pts.map((p)=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#1f704f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p)=><g key={p.mes}><circle cx={p.x} cy={p.y} r="5" fill="#1f704f"/><text x={p.x} y={altura-2} textAnchor="middle" fontSize="12" fill="#60766a">{p.mes}</text></g>)}
        </svg>
        <div style={styles.linhaTotal}>{br(dados[dados.length-1]?.valor || 0,0)} t</div>
      </div>
    </div>
  )
}

function Kpi({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string
  valor: string
  detalhe?: string
}) {
  return (
    <div style={styles.kpi}>
      <span style={styles.kpiTitulo}>
        {titulo}
      </span>

      <strong style={styles.kpiValor}>
        {valor}
      </strong>

      {detalhe && (
        <small style={styles.kpiDetalhe}>
          {detalhe}
        </small>
      )}
    </div>
  )
}

function Destaque({
  titulo,
  valor,
  descricao,
}: {
  titulo: string
  valor: string
  descricao: string
}) {
  return (
    <div style={styles.destaque}>
      <div>
        <span style={styles.destaqueTitulo}>
          {titulo}
        </span>

        <strong style={styles.destaqueValor}>
          {valor}
        </strong>
      </div>

      <small style={styles.destaqueDescricao}>
        {descricao}
      </small>
    </div>
  )
}

const styles2: Record<string, React.CSSProperties> = {
  page:{minHeight:'100vh',background:'#e9f0ec',padding:'12px',boxSizing:'border-box',color:'#173c30',fontFamily:'Inter,system-ui,Arial,sans-serif'},
  hero:{background:'linear-gradient(120deg,#073d32,#0b5b47)',borderRadius:'18px',padding:'16px 18px 14px',color:'#fff',boxShadow:'0 12px 30px rgba(7,61,50,.18)'},
  heroTop:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',alignItems:'center',gap:'14px'},
  brand:{fontSize:'22px',fontWeight:950,letterSpacing:'.5px'},brandSub:{fontSize:'8px',letterSpacing:'2px',opacity:.72,marginTop:'3px'},
  heroTitle:{display:'flex',flexDirection:'column',alignItems:'center'},actions:{display:'flex',justifyContent:'flex-end',gap:'7px'},
  actionBtn:{border:'1px solid rgba(255,255,255,.3)',background:'rgba(255,255,255,.08)',color:'#fff',borderRadius:'9px',padding:'8px 12px',fontWeight:800,cursor:'pointer'},
  refreshBtn:{border:0,background:'#f1c84b',color:'#173c30',borderRadius:'9px',padding:'8px 13px',fontWeight:900,cursor:'pointer'},
  filterBar:{display:'grid',gridTemplateColumns:'1.15fr 1.15fr .38fr',gap:'8px',marginTop:'14px'},
  filterField:{display:'flex',flexDirection:'column',gap:'4px'},filterFieldSmall:{display:'flex',flexDirection:'column',gap:'4px'},
  filterSelect:{height:'36px',border:0,borderRadius:'9px',padding:'0 10px',background:'rgba(255,255,255,.96)',color:'#173c30',fontSize:'11px'},
  kpiStrip:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',margin:'8px 0'},
  kpiCard:{background:'#fff',borderRadius:'13px',padding:'10px 12px',minHeight:'68px',border:'1px solid #d7e2dc',boxShadow:'0 4px 12px rgba(20,60,45,.05)',display:'flex',flexDirection:'column',justifyContent:'center'},
  mainGrid:{display:'grid',gridTemplateColumns:'minmax(0,4fr) minmax(245px,1fr)',gap:'8px'},
  mapPanel:{background:'#fff',borderRadius:'14px',padding:'10px',border:'1px solid #d7e2dc',boxShadow:'0 5px 16px rgba(20,60,45,.06)'},
  panelHead:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',padding:'2px 3px 8px'},
  legend:{display:'flex',alignItems:'center',gap:'10px',fontSize:'9px'},mapWrap:{height:'360px',overflow:'hidden',borderRadius:'11px'},
  sidePanel:{background:'linear-gradient(180deg,#ffffff,#f7faf8)',borderRadius:'14px',padding:'13px',border:'1px solid #d7e2dc',boxShadow:'0 5px 16px rgba(20,60,45,.06)'},
  sideTitle:{display:'flex',flexDirection:'column',gap:'2px'},donutRow:{display:'grid',placeItems:'center',padding:'10px 0'},
  donut:{width:'132px',height:'132px',borderRadius:'50%',display:'grid',placeItems:'center'},donutInner:{width:'82px',height:'82px',borderRadius:'50%',background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'},
  statusRow:{display:'flex',justifyContent:'space-between',padding:'7px 3px',borderBottom:'1px solid #e6ece8'},sideDivider:{height:'8px'},
  miniStats:{display:'grid',gridTemplateColumns:'1fr',gap:'5px'},productionBadge:{marginTop:'9px',background:'#0d6048',color:'#fff',borderRadius:'12px',padding:'11px',display:'flex',flexDirection:'column',alignItems:'center'},
  analyticsHead:{display:'flex',justifyContent:'space-between',alignItems:'end',padding:'10px 3px 6px'},
  chartGrid:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'8px'},
  tablePanel:{marginTop:'8px',background:'#fff',borderRadius:'14px',padding:'11px',border:'1px solid #d7e2dc'},tableHead:{marginBottom:'7px'},
  footer:{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'12px',alignItems:'center',marginTop:'8px',padding:'9px 12px',background:'#073d32',color:'#fff',borderRadius:'11px'}
}

const styles: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight:'100vh', background:'#edf3ef', padding:'10px 12px 18px', maxWidth:'1720px', margin:'0 auto', boxSizing:'border-box', color:'#183f31', fontFamily:'Inter, system-ui, Arial, sans-serif',
  },

  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 700,
  },

  topo: {
    minHeight:'62px', borderRadius:'14px', padding:'10px 15px', background:'#fff', color:'#123d2f', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #d8e3dc', boxShadow:'0 6px 18px rgba(17,61,46,.07)',
  },

  marca: {
    fontSize:'20px', fontWeight:950, letterSpacing:'.4px', color:'#0d563d',
  },

  submarca: {
    marginTop:'3px', fontSize:'9px', color:'#74877c',
  },

  topoDireita: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'right',
    gap: '5px',
    fontSize: '13px',
  },

  tituloArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    margin: '18px 2px 14px',
  },

  titulo: {
    margin: 0,
    fontSize: '29px',
  },

  subtitulo: {
    margin: '6px 0 0',
    color: '#65776e',
  },

  botaoAtualizar: {
    border: 0,
    borderRadius: '12px',
    padding: '11px 16px',
    background: '#1c6248',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },

  erro: {
    background: '#fff0f0',
    border: '1px solid #f2cccc',
    color: '#9d3030',
    padding: '13px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
  },

  filtros: {
    display:'grid', gridTemplateColumns:'1.15fr 1.15fr .45fr', gap:'8px', margin:'8px 0',
  },

  campo: {
    flex: '1 1 300px',
  },

  campoPequeno: {
    flex: '0 1 160px',
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#687a70',
    textTransform: 'uppercase',
  },

  select: {
    width:'100%', height:'36px', borderRadius:'9px', border:'1px solid #d4e0d8', background:'#fff', padding:'0 10px', color:'#183f31', fontSize:'11px',
  },

  kpis: {
    display:'grid', gridTemplateColumns:'repeat(5,minmax(125px,1fr))', gap:'8px', marginBottom:'8px',
  },

  kpi: {
    minHeight:'72px', background:'#fff', border:'1px solid #d8e3dc', borderRadius:'12px', padding:'11px 13px', boxSizing:'border-box', boxShadow:'0 4px 14px rgba(20,68,49,.045)',
  },

  kpiTitulo: {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '.8px',
    color: '#70857a',
    fontWeight: 800,
  },

  kpiValor: {
    display:'block', marginTop:'5px', fontSize:'20px', lineHeight:1, color:'#0d4835',
  },

  kpiDetalhe: {
    display: 'block',
    marginTop: '7px',
    color: '#72847b',
  },

  gradePrincipal: {
    display:'grid', gridTemplateColumns:'minmax(0,3.15fr) minmax(270px,.85fr)', gap:'8px', alignItems:'stretch',
  },

  cardMapa: {
    background:'#fff', border:'1px solid #d8e3dc', borderRadius:'12px', padding:'11px', minHeight:'365px', boxShadow:'0 4px 14px rgba(20,68,49,.045)',
  },

  cardDestaques: {
    background:'#fff', border:'1px solid #d8e3dc', borderRadius:'12px', padding:'11px', minHeight:'365px', boxShadow:'0 4px 14px rgba(20,68,49,.045)',
  },

  card: {
    background: '#fff',
    border: '1px solid #dce5df',
    borderRadius: '20px',
    padding: '18px',
    boxShadow:
      '0 7px 20px rgba(20,68,49,.05)',
  },

  cardCabecalho: {
    display:'flex', justifyContent:'space-between', gap:'10px', marginBottom:'8px',
  },

  cardSubtitulo: {
    display: 'block',
    marginTop: '4px',
    color: '#7b8c83',
    fontSize: '11px',
  },

  badge: {
    height: 'fit-content',
    padding: '6px 9px',
    borderRadius: '999px',
    background: '#edf5ef',
    fontSize: '11px',
    fontWeight: 800,
  },


  mapaReal: {
    minHeight:'295px', height:'295px', borderRadius:'10px', background:'radial-gradient(circle at 30% 30%,#e7efe8,#cfded2)', position:'relative', overflow:'hidden', border:'1px solid #d2dfd5',
  },

  mapaSvg: {
    width: '100%',
    height: '100%',
    display: 'block',
  },

  mapaLegenda: {
    position: 'absolute',
    left: '14px',
    right: '14px',
    bottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,.92)',
    boxShadow: '0 5px 16px rgba(20,68,49,.10)',
    fontSize: '11px',
  },

  mapaContagem: {
    whiteSpace: 'nowrap',
    fontWeight: 800,
    color: '#24533f',
  },

  mapaVazio: {
    minHeight:'295px', borderRadius:'10px', background:'radial-gradient(circle at 30% 30%,#e7efe8,#cfded2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', color:'#345646',
  },


  mapaPlaceholder: {
    minHeight: '330px',
    borderRadius: '16px',
    background:
      'radial-gradient(circle at 30% 30%,#e8f0e9,#dce8df)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#345646',
  },

  mapaIcone: {
    fontSize: '55px',
    lineHeight: 1,
  },

  destaque: {
    padding: '12px 0',
    borderBottom:
      '1px solid #edf1ee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    gap: '10px',
  },

  destaqueTitulo: {
    display: 'block',
    color: '#708278',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  destaqueValor: {
    display: 'block',
    fontSize: '19px',
    marginTop: '4px',
  },

  destaqueDescricao: {
    color: '#87958d',
    textAlign: 'right',
  },

  gradeInferior: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1.4fr) minmax(300px,.8fr)',
    gap: '14px',
    marginTop: '14px',
  },

  barras: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  barraLinha: {
    width: '100%',
  },

  barraInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '11px',
    marginBottom: '5px',
  },

  barraFundo: {
    height: '9px',
    borderRadius: '999px',
    background: '#edf2ee',
    overflow: 'hidden',
  },

  barraValor: {
    height: '100%',
    borderRadius: '999px',
    background:
      'linear-gradient(90deg,#276a50,#78a887)',
  },

  listaTch: {
    display: 'flex',
    flexDirection: 'column',
  },

  tchLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom:
      '1px solid #edf1ee',
    fontSize: '12px',
  },

  rodape: {
    marginTop: '14px',
    borderRadius: '18px',
    padding: '17px 20px',
    background: '#173f31',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rodapeDireita: {
    fontSize: '12px',
    opacity: 0.85,
  },

  resumoMini: { display:'grid', gap:'9px', marginBottom:'16px' },
  resumoMiniItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 13px', borderRadius:'12px', background:'#f4f8f5', fontSize:'12px' },
  listaRanking: { display:'flex', flexDirection:'column', gap:'7px' },
  rankingLinha: { width:'100%', border:'1px solid #e1e9e3', background:'#fff', borderRadius:'12px', padding:'10px', display:'grid', gridTemplateColumns:'28px minmax(0,1fr) auto', alignItems:'center', gap:'9px', color:'#183f31', cursor:'pointer', textAlign:'left' },
  rankingPosicao: { width:'25px', height:'25px', borderRadius:'8px', background:'#e8f3eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#276a50' },
  rankingNome: { display:'flex', flexDirection:'column', minWidth:0 },
  botaoTodas: { marginTop:'14px', width:'100%', border:0, borderRadius:'11px', padding:'11px', background:'#1c6248', color:'#fff', fontWeight:800, cursor:'pointer' },
  gradeGraficos: { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'8px', marginTop:'8px' },
  cardGrafico: { minHeight:'215px', background:'#fff', border:'1px solid #d8e3dc', borderRadius:'12px', padding:'11px', boxShadow:'0 4px 14px rgba(20,68,49,.045)', overflow:'hidden' },
  graficoBarras: { height:'180px', display:'flex', alignItems:'stretch', gap:'7px', paddingTop:'6px' },
  colunaItem: { flex:1, minWidth:0, display:'flex', flexDirection:'column', alignItems:'center' },
  colunaValor: { height:'26px', fontSize:'9px', fontWeight:800, whiteSpace:'nowrap' },
  colunaArea: { flex:1, width:'72%', minHeight:'125px', display:'flex', alignItems:'end', borderBottom:'1px solid #dfe7e1' },
  colunaBarra: { width:'100%', minHeight:'4px', borderRadius:'6px 6px 2px 2px', background:'linear-gradient(180deg,#2b7b57,#6eaa7c)' },
  colunaRotulo: { marginTop:'7px', fontSize:'9px', fontWeight:700, color:'#60766a', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' },
  linhaWrap: { height:'180px', position:'relative' },
  linhaSvg: { width:'100%', height:'100%', display:'block' },
  linhaTotal: { position:'absolute', right:'6px', top:'2px', padding:'5px 8px', borderRadius:'9px', background:'#edf5ef', color:'#1c6248', fontSize:'10px', fontWeight:900 },
  semDados: { margin:'auto', color:'#7b8c83', fontSize:'12px' },
  cardTabela: { marginTop:'8px', background:'#fff', border:'1px solid #d8e3dc', borderRadius:'12px', padding:'12px', boxShadow:'0 4px 14px rgba(20,68,49,.045)' },
  tabelaScroll: { overflowX:'auto' },
  tabela: { width:'100%', borderCollapse:'collapse', fontSize:'12px' },

  mapaTopoDireita: { display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', justifyContent:'flex-end' },
  legendaStatus: { display:'flex', alignItems:'center', gap:'12px', fontSize:'11px', fontWeight:800, color:'#536a5e' },
  legendaItem: { display:'inline-flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' },
  legendaCor: { width:'11px', height:'11px', borderRadius:'3px', display:'inline-block' },

  acoes: { display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' },
  botaoSecundario: { border:'1px solid #cddbd2', borderRadius:'12px', padding:'11px 14px', background:'#fff', color:'#1c6248', fontWeight:800, cursor:'pointer' },
  faixaStatus: { border:'1px solid #e0e9e2', borderRadius:'14px', padding:'13px', background:'#fbfdfb', marginTop:'4px' },
  statusTitulo: { fontSize:'11px', fontWeight:900, textTransform:'uppercase', letterSpacing:'.5px', color:'#6d8075', marginBottom:'8px' },
  statusLinha: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #edf2ee', fontSize:'12px' },
  destaqueCompacto: { marginTop:'14px', padding:'15px', borderRadius:'14px', background:'linear-gradient(135deg,#164b38,#247052)', color:'#fff', display:'flex', flexDirection:'column', gap:'5px' },

  secaoGraficosTitulo: { display:'flex', justifyContent:'space-between', alignItems:'end', gap:'12px', marginTop:'18px', marginBottom:'8px', padding:'0 4px' },

  identidade: { display:'flex', alignItems:'center', gap:'14px', minWidth:0 },
  divisorTopo: { width:'1px', height:'34px', background:'#d9e5dd' },
  moduloTitulo: { display:'block', fontSize:'12px', color:'#174b38' },
  moduloSafra: { display:'block', fontSize:'11px', color:'#708277', marginTop:'3px' },

  andamentoBloco: { display:'grid', gridTemplateColumns:'132px 1fr', gap:'12px', alignItems:'center', padding:'6px 0 10px' },
  donut: { width:'126px', height:'126px', borderRadius:'50%', display:'grid', placeItems:'center' },
  donutCentro: { width:'78px', height:'78px', borderRadius:'50%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 0 0 1px #e4ebe6' },
  statusResumo: { display:'flex', flexDirection:'column', gap:'9px', fontSize:'10px' },
  statusResumoLinha: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px', paddingBottom:'6px', borderBottom:'1px solid #edf1ee' },
  resumoCards3: { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'5px', marginBottom:'8px' },
  barrasHorizontais: { height:'155px', overflowY:'auto', paddingRight:'4px', display:'flex', flexDirection:'column', gap:'5px' },
  barraHItem: { display:'grid', gridTemplateColumns:'54px 1fr 58px', gap:'6px', alignItems:'center', minHeight:'15px' },
  barraHRotulo: { fontSize:'8px', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  barraHTrilho: { height:'8px', background:'#edf2ee', borderRadius:'999px', overflow:'hidden' },
  barraHPreenchimento: { height:'100%', background:'linear-gradient(90deg,#236b4e,#63a878)', borderRadius:'999px' },
  barraHValor: { fontSize:'8px', textAlign:'right', whiteSpace:'nowrap' },

}

export default Producao