# UtilsLA — Tema de Shopify

Este repositorio contiene el tema de la tienda Shopify **UtilsLA** (`utilsla.myshopify.com`).

## Negocio

- **Tienda:** UtilsLA
- **Producto:** producto único, un proyector de luces navideñas. No hay más productos ni catálogo.
- **Mercado:** venta solo en la Unión Europea. Precios en EUR. No añadir envíos, mercados ni textos dirigidos fuera de la UE.
- **Idioma:** español. Todos los textos de la tienda, los commits y las respuestas van en español.

## Reglas

- **Nunca publicar cambios en el tema en vivo sin permiso explícito del dueño.**
  - Para subir cambios, usar siempre un tema sin publicar:
    `shopify theme push --store utilsla.myshopify.com --unpublished`
  - Prohibido sin permiso: `shopify theme push --live`, `shopify theme push` contra el tema publicado, `shopify theme publish`, o cualquier acción que cambie el tema activo.
  - Para previsualizar en local: `shopify theme dev --store utilsla.myshopify.com`.
- Antes de cambios grandes, ejecutar `shopify theme check` y revisar los errores.

## Comandos útiles

- Descargar el tema publicado: `shopify theme pull --store utilsla.myshopify.com --live`
- Listar temas: `shopify theme list --store utilsla.myshopify.com`
