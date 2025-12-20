/**
 * uni-app 网络请求封装
 * 基于 uni.request API，支持拦截器、错误处理、Token 管理
 */

// 基础配置
const BASE_URL = 'http://localhost:5001'  // 开发环境（匹配 app.py 的端口）
// const BASE_URL = 'https://api.swordedge.com' // 生产环境

const TIMEOUT = 30000 // 请求超时时间（毫秒）

// 构建完整请求 URL
const buildUrl = (url) => {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return BASE_URL + url
}

// 全局加载计数，避免多个并发请求造成 show/hide 不配对警告
let __loadingCount = 0
const _showLoading = (opts = { title: '加载中...', mask: true }) => {
  try {
    __loadingCount = Math.max(0, __loadingCount) + 1
    if (__loadingCount === 1) uni.showLoading(opts)
  } catch (e) { console.warn('showLoading error', e) }
}
const _hideLoading = () => {
  try {
    __loadingCount = Math.max(0, __loadingCount - 1)
    if (__loadingCount <= 0) {
      __loadingCount = 0
      uni.hideLoading()
    }
  } catch (e) { console.warn('hideLoading error', e) }
}

/**
 * 请求拦截器 - 添加 Token、自定义 Header
 */
const requestInterceptor = (config) => {
  // 添加 Token
  const token = uni.getStorageSync('token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 添加 Content-Type
  if (!config.header['Content-Type']) {
    config.header['Content-Type'] = 'application/json'
  }
  
  // 添加时间戳，防止缓存
  if (config.method === 'get') {
    config.url += (config.url.includes('?') ? '&' : '?') + `_t=${Date.now()}`
  }
  
  return config
}

/**
 * 响应拦截器 - 统一错误处理、Token 刷新
 */
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  // 网络请求成功
  if (statusCode === 200) {
    // 如果后端明确返回 error 字段或 success=false 或 code 表示失败，则视为业务失败
    if (data && (data.error || data.err)) {
      uni.showToast({ title: data.message || data.error || '请求失败', icon: 'none', duration: 2000 })
      throw data
    }

    if (data && typeof data === 'object') {
      if ('success' in data && !data.success) {
        uni.showToast({ title: data.message || '请求失败', icon: 'none', duration: 2000 })
        throw data
      }
      if ('code' in data && data.code !== 0 && data.code !== 200) {
        uni.showToast({ title: data.message || '请求失败', icon: 'none', duration: 2000 })
        throw data
      }
    }
    // 其他情况：HTTP 200 且无 error 字段，视为成功并返回原始数据（兼容后端未包装的返回）
    return data
  } else {
    // 网络请求失败
    let errorMsg = '请求失败'
    switch (statusCode) {
      case 400: errorMsg = '请求参数错误'; break
      case 401: 
        errorMsg = '未登录或登录已过期';
        // 跳转到登录页
        uni.navigateTo({
          url: '/pages/login/login'
        })
        break
      case 403: errorMsg = '没有操作权限'; break
      case 404: errorMsg = '请求的资源不存在'; break
      case 500: errorMsg = '服务器内部错误'; break
      case 502: errorMsg = '网关错误'; break
      case 503: errorMsg = '服务不可用'; break
      case 504: errorMsg = '网关超时'; break
      default: errorMsg = `请求失败，状态码：${statusCode}`
    }
    
    uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
    throw { statusCode, message: errorMsg }
  }
}

/**
 * 网络请求封装
 * @param {Object} config - uni.request 配置对象
 * @param {Boolean} showLoading - 是否显示加载动画
 * @param {Function} onProgress - 上传/下载进度回调
 * @returns {Promise} - 返回 Promise 对象
 */
const request = (config, showLoading = true, onProgress) => {
  return new Promise((resolve, reject) => {
    // 应用请求拦截器
    config = requestInterceptor(config)
    // 拼接完整 URL
    config.url = buildUrl(config.url)
    
    // 显示加载动画（使用计数器）
    if (showLoading) {
      _showLoading({ title: '加载中...', mask: true })
    }
    
    // 发送请求
    uni.request({
      ...config,
      timeout: config.timeout || TIMEOUT,
      success: (response) => {
        try {
          const result = responseInterceptor(response)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        // 网络请求失败
        console.error('[Request] Network Error:', error)
        let errorMsg = '网络请求失败'
        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查网络'
          } else if (error.errMsg.includes('fail')) {
            errorMsg = '网络请求失败'
          }
        }
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        reject(new Error(errorMsg))
      },
      complete: () => {
        // 隐藏加载动画（使用计数器）
        if (showLoading) {
          _hideLoading()
        }
      }
    })
  })
}

/**
 * GET 请求
 * @param {String} url - 请求 URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置选项
 * @returns {Promise} - 返回 Promise 对象
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'get',
    data,
    ...options
  }, options.showLoading !== false)
}

/**
 * POST 请求
 * @param {String} url - 请求 URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置选项
 * @returns {Promise} - 返回 Promise 对象
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'post',
    data,
    ...options
  }, options.showLoading !== false)
}

/**
 * PUT 请求
 * @param {String} url - 请求 URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置选项
 * @returns {Promise} - 返回 Promise 对象
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'put',
    data,
    ...options
  }, options.showLoading !== false)
}

/**
 * DELETE 请求
 * @param {String} url - 请求 URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置选项
 * @returns {Promise} - 返回 Promise 对象
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'delete',
    data,
    ...options
  }, options.showLoading !== false)
}

/**
 * 文件上传
 * @param {String} url - 上传 URL
 * @param {Object} file - 文件对象
 * @param {Object} data - 额外参数
 * @param {Function} onProgress - 上传进度回调
 * @returns {Promise} - 返回 Promise 对象
 */
const uploadFile = (url, file, data = {}, onProgress) => {
  return new Promise((resolve, reject) => {
    // 显示加载动画（上传）
    _showLoading({ title: '上传中...', mask: true })
    
    // 处理 file 参数（支持传入字符串 path 或 文件对象）
    let filePath = ''
    let fieldName = 'file'
    if (typeof file === 'string') {
      filePath = file
    } else if (file && typeof file === 'object') {
      filePath = file.path || file.filePath || ''
      fieldName = file.name || file.fieldName || fieldName
    }

    // 根据 URL 推断表单字段名（video/frame）优先
    if (url.includes('start_analysis') || url.includes('analyze_video')) fieldName = 'video'
    if (url.includes('analyze_frame')) fieldName = 'frame'

    // 若调用方通过 data 指定 fieldName，则采用之
    if (data && data.fieldName) {
      fieldName = data.fieldName
      // 移除 fieldName 避免发送到服务器
      delete data.fieldName
    }

    // 发送上传请求
    const uploadTask = uni.uploadFile({
      url: buildUrl(url),
      filePath: filePath,
      name: fieldName,
      formData: data,
      success: (res) => {
        try {
          const result = JSON.parse(res.data)
          // 与 responseInterceptor 相同策略：若包含 error / success=false / 非0/200 code 则判失败
          if (result && (result.error || result.err)) {
            uni.showToast({ title: result.message || result.error || '上传失败', icon: 'none', duration: 2000 })
            reject(result)
            return
          }
          if (result && typeof result === 'object') {
            if ('success' in result && !result.success) {
              uni.showToast({ title: result.message || '上传失败', icon: 'none', duration: 2000 })
              reject(result)
              return
            }
            if ('code' in result && result.code !== 0 && result.code !== 200) {
              uni.showToast({ title: result.message || '上传失败', icon: 'none', duration: 2000 })
              reject(result)
              return
            }
          }
          resolve(result)
        } catch (error) {
          console.error('[Upload] Parse Error:', error)
          // 如果解析失败，仍尝试返回原始文本作为成功（部分后端直接返回纯文本/JSON string）
          try { resolve(JSON.parse(res.data)) } catch (e) { resolve(res.data) }
        }
      },
      fail: (err) => {
        console.error('[Upload] Network Error:', err)
        let errorMsg = '上传失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '上传超时，请检查网络'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络请求失败'
          }
        }
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        reject(new Error(errorMsg))
      },
      complete: () => {
        // 隐藏加载动画（上传）
        _hideLoading()
      }
    })
    
    // 监听上传进度
    if (onProgress && typeof onProgress === 'function') {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress) // 0-100
      })
    }
  })
}

/**
 * 文件下载
 * @param {String} url - 下载 URL
 * @param {String} fileName - 文件名
 * @param {Function} onProgress - 下载进度回调
 * @returns {Promise} - 返回 Promise 对象
 */
const downloadFile = (url, fileName, onProgress) => {
  return new Promise((resolve, reject) => {
    // 显示加载动画（下载）
    _showLoading({ title: '下载中...', mask: true })

    // 发送下载请求
    const downloadTask = uni.downloadFile({
      url: buildUrl(url),
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存文件到本地
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              _hideLoading()
              uni.showToast({
                title: '下载成功',
                icon: 'success',
                duration: 2000
              })
              resolve(saveRes.savedFilePath)
            },
            fail: (saveErr) => {
              console.error('[Download] Save Error:', saveErr)
              _hideLoading()
              uni.showToast({
                title: '保存文件失败',
                icon: 'none',
                duration: 2000
              })
              reject(new Error('保存文件失败'))
            }
          })
        } else {
          console.error('[Download] Server Error:', res)
          _hideLoading()
          uni.showToast({
            title: '下载失败',
            icon: 'none',
            duration: 2000
          })
          reject(new Error('下载失败'))
        }
      },
      fail: (err) => {
        console.error('[Download] Network Error:', err)
        let errorMsg = '下载失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '下载超时，请检查网络'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络请求失败'
          }
        }
        _hideLoading()
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        reject(new Error(errorMsg))
      }
    })

    // 监听下载进度
    if (onProgress && typeof onProgress === 'function') {
      downloadTask.onProgressUpdate((res) => {
        onProgress(res.progress) // 0-100
      })
    }
  })
}

/**
 * Socket.IO 连接管理
 */
class WebSocketClient {
  constructor(url) {
    // SocketIO 使用根路径连接，命名空间通过 connection 事件处理
    this.url = BASE_URL
    this.namespace = url
    this.socket = null
    this.isConnected = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.messageHandlers = []
    this.isManualClose = false // 标记是否手动关闭
  }

  // 连接 Socket.IO
  connect() {
    return new Promise((resolve, reject) => {
      console.log(`[Socket.IO] Connecting to: ${this.url}`)
      try {
        // 注意：在浏览器环境中，Socket.IO客户端需要通过正确的ES模块导入
        // 这里暂时注释掉Socket.IO相关代码，改用模拟数据
        console.warn('[Socket.IO] Socket.IO功能暂时禁用，使用模拟数据')
        resolve()
        return
        
        /*
        // 创建 Socket.IO 客户端实例
        this.socket = io(this.url, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000
        })

        // 连接成功事件
        this.socket.on('connect', () => {
          console.log('[Socket.IO] Connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve()
        })

        // 接收消息事件
        this.socket.on('frame', (data) => {
          console.log('[Socket.IO] Message:', data)
          this.messageHandlers.forEach(handler => handler(data))
        })

        // 断开连接事件
        this.socket.on('disconnect', () => {
          console.log('[Socket.IO] Disconnected')
          this.isConnected = false
          if (!this.isManualClose) {
            console.log('[Socket.IO] Will attempt to reconnect automatically')
          }
        })

        // 连接错误事件
        this.socket.on('connect_error', (err) => {
          console.error('[Socket.IO] Connection Error:', JSON.stringify(err))
          this.isConnected = false
        })

        // 重连尝试事件
        this.socket.on('reconnect_attempt', (attempt) => {
          console.log(`[Socket.IO] Reconnecting... (${attempt}/${this.maxReconnectAttempts})`)
          this.reconnectAttempts = attempt
        })

        // 重连成功事件
        this.socket.on('reconnect', (attempt) => {
          console.log(`[Socket.IO] Reconnected after ${attempt} attempts`)
          this.isConnected = true
        })

        // 重连失败事件
        this.socket.on('reconnect_failed', () => {
          console.error('[Socket.IO] Max reconnect attempts reached')
          this.isConnected = false
        })
        */
      } catch (err) {
        console.error('[Socket.IO] Connection Failed:', JSON.stringify(err))
        reject(err)
      }
    })
  }

  // 发送消息
  send(data) {
    if (this.isConnected) {
      try {
        this.socket.emit('calibrate', data)
        console.log('[Socket.IO] Sent:', data)
      } catch (err) {
        console.error('[Socket.IO] Send Failed:', JSON.stringify(err))
      }
    } else {
      console.warn('[Socket.IO] Not connected, cannot send message')
    }
  }

  // 监听消息
  onMessage(handler) {
    this.messageHandlers.push(handler)
  }

  // 断开连接
  close() {
    this.isManualClose = true
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
      clearTimeout(this.reconnectTimer)
    }
  }

  // 自动重连（Socket.IO 客户端会自动处理重连，此方法保持兼容）
  reconnect() {
    if (this.socket && !this.isConnected && !this.isManualClose) {
      console.log('[Socket.IO] Reconnecting...')
      this.socket.connect()
    }
  }
}

export const createWebSocket = (url) => {
  return new WebSocketClient(url)
}

// 命名导出
export {
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile
}

// 默认导出
export default {
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile,
  createWebSocket
}