// Translation object for the entire application
export const translations = {
    English: {
      // Header
      home: "Home",
      adminTools: "Admin Tools",
      createProduct: "Create Product",
      drafts: "Drafts",
      editProduct: "Edit Product",
      deleteProduct: "Delete Product",
      gallery: "Gallery",
      users: "Users",
      login: "Log In",
      register: "Register",
      logout: "Log Out",
      search: "Search",
      yourCart: "Your Cart",
      items: "items",
      loading: "Loading",
      emptyCart: "Your cart is empty",
      showMore: "Show more",
      remaining: "remaining",
      subtotal: "Subtotal",
      checkout: "Checkout",
  
      // Product Detail
      backToProducts: "Back to Products",
      addToCart: "Add to Cart",
      adding: "Adding...",
      buyWithPayPal: "Buy with PayPal",
      otherPaymentMethods: "Other payment methods",
      quantity: "Quantity",
      available: "Available",
      materials: "Materials",
      sizes: "Sizes",
      shipping: "Shipping",
      productStats: "Product Stats",
      views: "Views",
  
      // Recommended Products
      recommendedProducts: "Recommended Products",
  
      // Comments
      comments: "Comments",
      writeComment: "Write a comment...",
      postComment: "Post Comment",
      posting: "Posting...",
      needLogin: "You need to be logged in to comment",
      loadingComments: "Loading comments...",
      noComments: "No comments yet. Be the first to comment!",
      reply: "Reply",
      cancel: "Cancel",
      writeReply: "Write a reply...",
      postReply: "Post Reply",
  
      // Cart Messages
      productAdded: "Product added to cart!",
      maxStockReached: "Maximum stock reached!",
      failedToAdd: "Failed to add to cart",
      errorAddingToCart: "Error adding to cart",
  
      // Errors
      error: "Error",
      productNotFound: "Product not found",
      returnToHome: "Return to Home",
      loadingProductDetails: "Loading product details...",
  
      // PayPal
      paypalInitiated: "PayPal checkout initiated! Check console for invoice details.",
      errorProcessingPaypal: "Error processing PayPal checkout",
    },
    Spanish: {
      // Header
      home: "Inicio",
      adminTools: "Herramientas",
      createProduct: "Crear Producto",
      drafts: "Borradores",
      editProduct: "Editar Producto",
      deleteProduct: "Eliminar Producto",
      gallery: "Galería",
      users: "Usuarios",
      login: "Iniciar Sesión",
      register: "Registrarse",
      logout: "Cerrar Sesión",
      search: "Buscar",
      yourCart: "Tu Carrito",
      items: "artículos",
      loading: "Cargando",
      emptyCart: "Tu carrito está vacío",
      showMore: "Mostrar más",
      remaining: "restantes",
      subtotal: "Subtotal",
      checkout: "Pagar",
  
      // Product Detail
      backToProducts: "Volver a Productos",
      addToCart: "Añadir al Carrito",
      adding: "Añadiendo...",
      buyWithPayPal: "Comprar con PayPal",
      otherPaymentMethods: "Otros métodos de pago",
      quantity: "Cantidad",
      available: "Disponible",
      materials: "Materiales",
      sizes: "Tallas",
      shipping: "Envío",
      productStats: "Estadísticas del Producto",
      views: "Vistas",
  
      // Recommended Products
      recommendedProducts: "Productos Recomendados",
  
      // Comments
      comments: "Comentarios",
      writeComment: "Escribe un comentario...",
      postComment: "Publicar Comentario",
      posting: "Publicando...",
      needLogin: "Necesitas iniciar sesión para comentar",
      loadingComments: "Cargando comentarios...",
      noComments: "No hay comentarios aún. ¡Sé el primero en comentar!",
      reply: "Responder",
      cancel: "Cancelar",
      writeReply: "Escribe una respuesta...",
      postReply: "Publicar Respuesta",
  
      // Cart Messages
      productAdded: "¡Producto añadido al carrito!",
      maxStockReached: "¡Stock máximo alcanzado!",
      failedToAdd: "Error al añadir al carrito",
      errorAddingToCart: "Error al añadir al carrito",
  
      // Errors
      error: "Error",
      productNotFound: "Producto no encontrado",
      returnToHome: "Volver al Inicio",
      loadingProductDetails: "Cargando detalles del producto...",
  
      // PayPal
      paypalInitiated: "¡Pago con PayPal iniciado! Revisa la consola para detalles de la factura.",
      errorProcessingPaypal: "Error al procesar el pago con PayPal",
    },
  }
  
  export type LanguageType = keyof typeof translations
  