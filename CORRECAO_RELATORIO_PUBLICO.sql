-- Souza Silva - correção do relatório público de Broca / Soltura
-- Execute TODO este arquivo no SQL Editor do Supabase.
-- Ele mantém o link somente-leitura e passa a devolver TODAS as evidências
-- vinculadas aos monitoramentos que fazem parte do relatório.

create or replace function public.relatorio_publico_broca(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rel public.relatorios_compartilhados%rowtype;
  v_cliente jsonb;
  v_apontamentos jsonb;
begin
  select * into v_rel
  from public.relatorios_compartilhados
  where token = p_token
    and status = 'ativo'
  limit 1;

  if v_rel.id is null then
    return jsonb_build_object('sucesso', false, 'erro', 'Relatório não encontrado ou link revogado.');
  end if;

  select jsonb_build_object(
    'id', c.id,
    'nome', c.nome,
    'logo_url', c.logo_url
  ) into v_cliente
  from public.clientes c
  where c.id = v_rel.cliente_id;

  select coalesce(jsonb_agg(item order by coalesce(item->>'codigo',''), coalesce(item->>'fazenda','')), '[]'::jsonb)
  into v_apontamentos
  from (
    select jsonb_build_object(
      'id', m.id,
      'fazenda_id', m.fazenda_id,
      'codigo', coalesce(m.codigo_fazenda, m.codigo, f.codigo),
      'fazenda', f.nome,
      'talhoes', m.talhoes,
      'area_ha', m.area_ha,
      'armadilhas_programadas', m.quantidade_armadilhas,
      'armadilhas_instaladas', m.quantidade_armadilhas_instaladas,
      'responsavel_soltura', m.responsavel_soltura,
      'status_soltura', m.status_soltura,
      'justificativa', m.justificativa_soltura,
      'data_execucao_soltura', m.data_execucao_soltura,
      'evidencias', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e.id,
          'tipo', e.tipo,
          'etapa', e.etapa,
          'storage_path', e.storage_path,
          'nome_arquivo', e.nome_arquivo,
          'mime_type', e.mime_type,
          'tamanho_bytes', e.tamanho_bytes,
          'legenda', null
        ) order by e.criado_em)
        from public.broca_evidencias e
        where e.monitoramento_id = m.id
          and (e.etapa is null or lower(e.etapa) = 'soltura')
      ), '[]'::jsonb)
    ) as item
    from public.relatorio_broca_itens ri
    join public.broca_monitoramentos m on m.id = ri.monitoramento_id
    left join public.fazendas f on f.id = m.fazenda_id
    where ri.relatorio_id = v_rel.id
  ) q;

  return jsonb_build_object(
    'sucesso', true,
    'relatorio', jsonb_build_object(
      'id', v_rel.id,
      'titulo', v_rel.titulo,
      'safra', v_rel.safra,
      'data_inicio', v_rel.data_inicio,
      'data_fim', v_rel.data_fim,
      'status', v_rel.status
    ),
    'cliente', coalesce(v_cliente, '{}'::jsonb),
    'apontamentos', coalesce(v_apontamentos, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.relatorio_publico_broca(uuid) to anon, authenticated;

create or replace function public.relatorio_publico_evidencia(p_token uuid, p_evidencia_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e public.broca_evidencias%rowtype;
begin
  select e.* into v_e
  from public.broca_evidencias e
  join public.relatorio_broca_itens ri on ri.monitoramento_id = e.monitoramento_id
  join public.relatorios_compartilhados r on r.id = ri.relatorio_id
  where r.token = p_token
    and r.status = 'ativo'
    and e.id = p_evidencia_id
    and (e.etapa is null or lower(e.etapa) = 'soltura')
  limit 1;

  if v_e.id is null then
    return jsonb_build_object('sucesso', false, 'erro', 'Evidência não autorizada.');
  end if;

  return jsonb_build_object('sucesso', true, 'evidencia', jsonb_build_object(
    'id', v_e.id,
    'storage_path', v_e.storage_path,
    'nome_arquivo', v_e.nome_arquivo,
    'mime_type', v_e.mime_type,
    'tipo', v_e.tipo
  ));
end;
$$;

grant execute on function public.relatorio_publico_evidencia(uuid, uuid) to anon, authenticated;

-- 28/09/2026 - acesso de leitura às mídias que já pertencem a relatório público ativo.
-- Não libera upload, alteração nem exclusão.
create or replace function public.evidencia_broca_em_relatorio_publico(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.broca_evidencias e
    join public.relatorio_broca_itens ri on ri.monitoramento_id = e.monitoramento_id
    join public.relatorios_compartilhados r on r.id = ri.relatorio_id
    where e.storage_path = p_path
      and r.status = 'ativo'
      and (e.etapa is null or lower(e.etapa) = 'soltura')
  );
$$;

grant execute on function public.evidencia_broca_em_relatorio_publico(text) to anon, authenticated;

drop policy if exists "relatorio_publico_broca_ler_evidencias" on storage.objects;
create policy "relatorio_publico_broca_ler_evidencias"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'broca-evidencias'
  and public.evidencia_broca_em_relatorio_publico(name)
);
