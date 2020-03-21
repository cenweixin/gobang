class Gobang {
  constructor(options) {
    this.options = options
    // 获取棋盘画布
    this.chessboardCanvas = document.querySelector(options.canvas || '#chessboard')
    // 画布上下文对象
    this.context = this.chessboardCanvas.getContext('2d')
    // 获取结果展示节点
    this.result = document.querySelector('#result')

    // DOM版
    this.chessboardDom = document.querySelector('#chessboard-dom')
    this.currentRoleDom = null
    // 初始化
    this.init({})
  }

  // 初始化
  init({ VERSION = 'canvas'}) {
    console.log('init')
    const { options } = this
    this.VERSION = VERSION
    this.result.innerText = ''
    // 矩阵二维数组（存放角色在矩阵中位置）
    this.checkerboard = []
    // 当前要下棋的角色
    this.role = options.role
    // 获胜者
    this.winner = 0
    // 走棋的记录
    this.history = []
    // 记录走棋步数(用于悔棋、撤销悔棋、以及在落子时决定走棋记录history的长度)
    this.currentStep = 0
    // 初始棋盘矩阵
    this.initChessboardMatrix()
    if (VERSION === 'canvas') {
      // 画出棋盘
      this.drawChessboard()
    } else {
      // DOM版
      this.createChessboard()
    }
  }

  // 画出棋盘
  drawChessboard() {
    const { context, options, chessboardCanvas } = this
    const { count, latticeWidth, borderColor, lineWidth, padding, chessboardColor } = options.gobangStyle
    chessboardCanvas.width = chessboardCanvas.height = (count - 1) * latticeWidth + padding * 2 // 设置棋盘宽高
    context.fillStyle = chessboardColor
    context.fillRect(0, 0, (count - 1) * latticeWidth + padding * 2, (count - 1) * latticeWidth + padding * 2) // 绘制棋盘背景
    context.lineWidth = lineWidth // 线宽
    context.strokeStyle = borderColor // 线颜色
    for (let i = 0; i < count; i++) {
      // 横线
      context.beginPath()
      context.moveTo(padding, padding + i * latticeWidth) // 将会图游标移到x, y ， 不画线。
      context.lineTo(padding + count * latticeWidth - latticeWidth, padding + i * latticeWidth) // 从上一点(moveTo的坐标点)开始绘制一条直线，到x, y为止。
      context.stroke()
      // 竖线
      context.beginPath()
      context.moveTo(padding + i * latticeWidth, padding)
      context.lineTo(padding + i * latticeWidth, padding + count * latticeWidth - latticeWidth)
      context.stroke()
    }
    context.font = '8px Arial'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    context.fillStyle = '#999'
    context.fillText('canvas 版本', 10, 4)
    // 监听落子操作
    this.listenDownChessman(chessboardCanvas)
  }

  // 初始棋盘矩阵
  initChessboardMatrix() {
    const { options } = this
    const checkerboard = [] // 矩阵二维数组
    for(let x = 0; x < options.gobangStyle.count; x++){
      checkerboard[x] = []
      for(let y = 0; y < options.gobangStyle.count; y++){
        checkerboard[x][y] = 0 // 初始值传入0，表示空位
      }
    }
    this.checkerboard = checkerboard
  }

  // 判断输赢
  checkReferee(x, y, role) {
    let winner = false
    // 取出当前棋子在矩阵中的横向、竖向、左斜线、右斜线连成的数组，然后判断是否有5个连续相同的角色，若有，则赢。
    const XContinuous = this.checkerboard.map(x => x[y])
    const YContinuous = this.checkerboard[x]
    const LContinuous = []
    const RContinuous = []
    this.checkerboard.forEach((_y, i) => {
      // 左斜向
      let Litem = _y[y - (x - i)]
      if (Litem !== undefined) {
        LContinuous.push(Litem)
      }
      // 右斜线
      let Ritem = _y[y + (x - i)]
      if (Ritem !== undefined) {
        RContinuous.push(Ritem)
      }
    })
    ;[XContinuous, YContinuous, LContinuous, RContinuous].forEach(item => {
      // 判断是否有5个连续角色在一起
      winner = item.some((x, i) => {
        return x !== 0 && item[i-2] === item[i-1] && item[i-1] === item[i] && item[i] === item[i+1] && item[i+1] === item[i+2]
      })
      if (winner) {
        this.winner = role
        let msg = (role == 1 ? '黑' : '白') + '子胜利！'
        this.result.innerText = msg
        // 不允许再操作
        this.chessboard.onclick = null
      }
    })
  }

  // dom角色棋子
  createRoleChessman({x, y, iX, iY, r, isBlack}) {
    console.log('createRoleChessman:', x, y, iX, iY, r, isBlack)
    let el = 'span'
    let style = {
      'position': 'absolute', 'top': (iY - r) +'px', 'left': (iX - r) +'px', 'width': 2*r +'px', 'height': 2*r +'px', 
      'backgroundImage': isBlack ? 'radial-gradient(#666 0%, black 80%)' : 'radial-gradient(#ddd 0%, white 80%)', 
      'borderRadius': '50%', 'zIndex': 1
    }
    let parent = this.chessboardDom
    let chessman = Utils.createElement({el, parent, style})
    this.currentRoleDom = chessman
    console.log('落子前 history:', this.history)
    console.log('chessman:', chessman)
  }

  // 绘制角色棋子
  drawRoleChessman({x, y, iX, iY, r, context, isBlack}) {
    if (this.VERSION === 'canvas') {
      const gradient = context.createRadialGradient(iX, iY, 0, iX, iY, r)
      context.beginPath()
      context.arc(iX, iY, r, 0, 2 * Math.PI)
      if (isBlack) {
        gradient.addColorStop(0, '#666')
        gradient.addColorStop(1, '#000')
      } else {
        gradient.addColorStop(0, '#ddd')
        gradient.addColorStop(1, '#fff')
      }
      context.fillStyle = gradient
      context.fill()
    } else {
      // 绘制dom角色棋子
      this.createRoleChessman({x, y, iX, iY, r, isBlack})
    }

    // 判断输赢
    setTimeout(() => {
      this.checkReferee(x, y, isBlack ? 1 : 2)
    }, 0)
  }

  // 绘制悔棋棋子
  drawRegretChessman({x, y, iX, iY, r, context, borderColor}) {
    if (this.VERSION === 'canvas') {
      // 换算悔棋棋子中的十字交叉线的起始坐标与当前坐标需要偏差的距离；悔棋棋子稍微绘制大点才能覆盖，所以 r + 1
      const startOffsetX = x === 0 ? 0 : r + 1
      const endOffsetX = x === this.checkerboard.length - 1 ? 0 : r + 1
      const startOffsetY = y === 0 ? 0 : r + 1
      const endOffsetY = y === this.checkerboard.length - 1 ? 0 : r + 1
      // 棋子
      context.beginPath()
      context.arc(iX, iY, r + 1, 0, 2 * Math.PI)
      context.fillStyle = this.options.gobangStyle.chessboardColor // 棋子填充色与棋盘颜色一致
      context.fill()
      // 横线
      context.beginPath()
      context.strokeStyle = borderColor // 线颜色
      context.moveTo(iX - startOffsetX, iY)
      context.lineTo(iX + endOffsetX, iY)
      context.stroke()
      // 竖线
      context.beginPath()
      context.strokeStyle = borderColor // 线颜色
      context.moveTo(iX, iY - startOffsetY)
      context.lineTo(iX, iY + endOffsetY)
      context.stroke()
    } else {
      // dom 版悔棋，移除节点即可
      let nodeList = this.chessboardDom.querySelectorAll('span')
      this.chessboardDom.removeChild(nodeList[this.currentStep - 1])
    }
  }

  // 绘制棋子
  drawChessman(x, y, isBlack, isRegretChess) {
    console.log("绘制棋子: ", x, y, isBlack, isRegretChess)
    const { context, options } = this
    const { latticeWidth, padding, borderColor } = options.gobangStyle
    // 换算旗子实际坐标
    const iX = x * latticeWidth + padding
    const iY = y * latticeWidth + padding
    const r = latticeWidth/2 - 1 // 设置棋子半径
    if (isRegretChess) {
      // 绘制悔棋棋子
      this.drawRegretChessman({x, y, iX, iY, r, context, borderColor})
    } else {
      // 绘制角色棋子
      this.drawRoleChessman({x, y, iX, iY, r, context, isBlack})
    }
  }

  // 落子
  listenDownChessman(chessboard) {
    console.log('chessboard:', chessboard)
    this.chessboard = chessboard
    const { latticeWidth, padding } = this.options.gobangStyle
    chessboard.onclick = event => {
      // 获得落子相对棋盘(包括padding)的坐标
      let { offsetX: x, offsetY: y } = event
      // 换算出矩阵坐标（矩阵数组的下标）
      x = Math.round((x - padding) / latticeWidth)
      y = Math.round((y - padding) / latticeWidth)
      // 空位才可以落子（0 表示空位）
      console.log('落子前 checkerboard:', this.checkerboard)
      if (this.checkerboard[x][y] !== undefined && Object.is(this.checkerboard[x][y], 0)) {
        this.checkerboard[x][y] = this.role // 矩阵添加角色
        this.drawChessman(x, y, Object.is(this.role, 1)) // 绘制棋子  1 表示黑棋
        this.history.length = this.currentStep // 每次落子，都要让上次的走棋历史记录长度等于走棋步数(防止存在悔棋)
        this.history.push({x, y, role: this.role, currentRoleDom: this.currentRoleDom}) // 记录历史走棋
        console.log('落子后 history ==>', this.history)
        this.currentStep++ // 记录走棋步数
        this.role = Object.is(this.role , 1) ? 2 : 1 // 落子结束切换角色
      }
    }
  }

  // 悔棋操作
  regretChess() {
    if (this.currentStep === 0 || this.winner !== 0) return
    const prev = this.history[this.currentStep - 1]
    this.checkerboard[prev.x][prev.y] = 0 // 对应矩阵角色为空
    // 绘制棋子 - 悔棋
    this.drawChessman(prev.x, prev.y, false, true)
    this.currentStep-- // 当前走棋步数减1
    this.role = prev.role // 角色设为当前悔棋角色
  }

  // 撤销悔棋操作
  revokedRegretChess() {
    if (this.history.length <= this.currentStep) return // 悔棋步数走完
    this.currentStep++ // 当前走棋步数加1
    const prev = this.history[this.currentStep - 1]
    this.checkerboard[prev.x][prev.y] = prev.role // 矩阵添加角色
    // 绘制角色棋子
    this.drawChessman(prev.x, prev.y, Object.is(prev.role, 1), false)
    // 角色设为当前撤销悔棋角色的反角色
    this.role = Object.is(this.role , 1) ? 2 : 1
  }

  // dom版 画出棋盘
  createChessboard() {
    const { count, latticeWidth, borderColor, lineWidth, padding, chessboardColor } = this.options.gobangStyle
    console.log('chessboardDomCover:', this.chessboardDomCover)
    if (this.chessboardDomCover) {
      let nodeList = this.chessboardDom.querySelectorAll('span')
      let i = 0, len = nodeList.length
      for (i; i < len; i++) {
        this.chessboardDom.removeChild(nodeList[i])
      }
    } else {
      this.chessboardDom.style['width'] = this.chessboardDom.style['height'] = (count - 1) * latticeWidth + padding * 2 + 'px'
      this.chessboardDom.style['backgroundColor'] = chessboardColor
      for (let i = 0; i < count; i++) {
        let el = 'div', parent = this.chessboardDom
        // 竖线
        let styleY = {
          'width': lineWidth + 'px',
          'height': count * latticeWidth - latticeWidth + 'px',
          'backgroundColor': borderColor,
          'position': 'absolute',
          'top':padding + 'px',
          'left':padding + i * latticeWidth + 'px'
        }
        Utils.createElement({el, parent, style: styleY})
        // 横线
        let styleX = {
          'width': count * latticeWidth - latticeWidth + lineWidth + 'px',
          'height': lineWidth + 'px',
          'backgroundColor': borderColor,
          'position': 'absolute',
          'top': padding + i * latticeWidth +  'px',
          'left': padding +'px'
        }
        Utils.createElement({el, parent, style: styleX})
      }
      // 再画一个与棋盘一样大小的透明的覆盖层
      let el = 'div', parent = this.chessboardDom
      let style = {
        'width': (count - 1) * latticeWidth + padding * 2 + 'px',
        'height': (count - 1) * latticeWidth + padding * 2 + 'px',
        'position': 'absolute',
        'top': 0 + 'px',
        'left': 0 + 'px',
        'zIndex': 2,
        'cursor': 'pointer'
      }
      let chessboardDomCover = Utils.createElement({el, parent, style})
      chessboardDomCover.id = 'chessboardDomCover'
      this.chessboardDomCover = chessboardDomCover
    }
    // 监听落子操作
    this.listenDownChessman(chessboardDomCover)
  }
}

// 初始化五子棋
const gobang = new Gobang({
  canvas: '#chessboard',
  role: 1, // 角色 1黑棋 2白棋 ，这里是黑棋先下
  gobangStyle: {
    chessboardColor: '#f3cc9c', // 棋盘颜色
    count: 20, // 棋盘边数
    latticeWidth: 30, // 棋盘每小格宽度
    borderColor: '#999', // 棋盘描边颜色
    lineWidth: 2, // 棋盘线宽
    padding: 20 // 设绘制棋盘的起点坐标(20, 20)
  }
})

// 悔棋操作
const regretChess = document.querySelector('#regretChess')
regretChess.onclick = () => {
  gobang.regretChess()
}

// 撤销悔棋操作
const revokedRegretChess = document.querySelector('#revokedRegretChess')
revokedRegretChess.onclick = () => {
  gobang.revokedRegretChess()
}

// 重新开始
const restart = document.querySelector('#restart')
restart.onclick = () => {
  console.log('gobang.VERSION;;', gobang.VERSION)
  gobang.init({VERSION: gobang.VERSION})
}
