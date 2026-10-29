export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: '¿Qué necesita una explotación para probar AgroShield?',
    answer:
      'La demo local funciona con datos de ejemplo y no toca producción. Para una prueba real necesitas al menos un sensor compatible y una zona definida. Al dar de alta el sensor, su clave privada se muestra una sola vez.',
  },
  {
    question: '¿Cómo se comprueba que una lectura es auténtica?',
    answer:
      'Cada sensor firma la lectura con una clave Ed25519. El servidor guarda solo la clave pública, verifica la firma, rechaza lecturas fuera de la ventana temporal y deduplica los reintentos.',
  },
  {
    question: '¿Qué ocurre si un sensor se pierde?',
    answer:
      'Puedes revocar su clave desde el panel. A partir de ese momento, las lecturas firmadas con ella dejan de aceptarse. La rotación emite una clave nueva y también invalida la anterior.',
  },
  {
    question: '¿Las alertas son una predicción o una regla?',
    answer:
      'Las alertas combinan reglas agronómicas explicables con el estado del suelo. El pronóstico de tendencia y la predicción de riesgo están marcados como vista de ejemplo hasta validar el modelo con datos de campo.',
  },
  {
    question: '¿Funciona sin conexión?',
    answer:
      'La interfaz detecta la pérdida de red y no finge que una acción se ha guardado. No se promete operación offline completa: el dispositivo que firma lecturas debe poder enviarlas o reintentarlas.',
  },
  {
    question: '¿Qué pasa con los datos de mi organización?',
    answer:
      'Cada consulta se acota a la organización de la sesión. La analítica del sitio público es propia, no usa cookies de terceros y solo se activa si la aceptas.',
  },
  {
    question: '¿Puedo usar la demo en producción?',
    answer:
      'No. El seed y el simulador son material de demostración, requieren DEMO_MODE y no deben apuntar a una base de producción. La demo no representa clientes reales.',
  },
  {
    question: '¿Comunidad, aprendizaje o facturación están incluidos?',
    answer:
      'No forman parte de esta entrega y la interfaz no los presenta como disponibles. Se documentan como trabajo pendiente, junto con los precios y la pasarela de pago.',
  },
  {
    question: '¿Cuánto cuesta?',
    answer:
      'Todavía no hay planes ni precios públicos. La demo sirve para acotar superficie, cultivos y número de sensores antes de proponer un alcance.',
  },
];
