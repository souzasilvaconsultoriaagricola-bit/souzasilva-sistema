import React from 'react';

type Props = {
  auditoria?: any;
};

export default function ImportadorBonsucro({ auditoria }: Props) {
  return (
    <div
      style={{
        padding: '24px',
        background: '#ffffff',
        borderRadius: '18px',
        color: '#123d2c',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Importador Bonsucro</h2>

      <p>
        Módulo de importação de documentos Bonsucro pronto para configuração.
      </p>

      {auditoria?.safra && (
        <p>
          <strong>Safra:</strong> {auditoria.safra}
        </p>
      )}
    </div>
  );
}