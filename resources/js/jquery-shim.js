// Use porto jQuery (loaded as <script> in layout) instead of bundling a second copy.
// This prevents the dual-jQuery problem where Vite's jQuery would overwrite window.$.
const jq = window.jQuery || window.$;
export default jq;
export { jq as jQuery };
