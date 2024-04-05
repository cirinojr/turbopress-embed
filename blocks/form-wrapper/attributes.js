export default {
  titulo: {
    type: 'string',
    default: 'Headline'
  },

  paragrafo_1: {
    type: 'string',
    default: 'Caso deseje aplicar para esse cartão surpresa com limite de...'
  },
  paragrafo_2: {
    type: 'string',
    default: 'Caso deseje aplicar para esse cartão surpresa com limite de...'
  },
  paragrafo_3: {
    type: 'string',
    default: 'Caso deseje aplicar para esse cartão surpresa com limite de...'
  },
  image: {
    type: 'object',
    default: {
      id: '',
      src: '/wp-content/plugins/skallar-form-v6/assets/images/header.webp',
      alt: '',
      x: 50,
      y: 50,
    },
  },

  image2: {
    type: 'object',
    default: {
      id: '',
      src: '/wp-content/plugins/skallar-form-v6/assets/images/range.webp',
      alt: '',
      x: 50,
      y: 50,
    },
  },

  image3: {
    type: 'object',
    default: {
      id: '',
      src: '/wp-content/plugins/skallar-form-v6/assets/images/checks.webp',
      alt: '',
      x: 50,
      y: 50,
    },
  }
};
