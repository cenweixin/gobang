const Utils ={
  /**
   * @discriptions 动态创建一个元素el，并插入到父元素parent中
   * @param {String} el
   * @param {ParentNode} parent
   * @param {Object} style
  */

  createElement: function({ el='div', parent=null, style={} }) {
    // console.log('createElement==>', el, parent, style)
    el = document.createElement(el)
    for (let key of Object.keys(style)) {
      el.style[key] = style[key]
    }
    parent.appendChild(el)
    return el
  }
}
