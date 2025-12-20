# 配置文件
import os

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    
    # 上传配置
    UPLOAD_FOLDER = os.path.join('static', 'uploads')
    REPORTS_FOLDER = os.path.join('static', 'reports')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    
    # 允许的文件类型
    ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv'}
    
    # 分析配置
    MAX_WORKERS = 4  # 最大分析线程数
    
    # 日志配置
    LOG_LEVEL = 'INFO'
    
    # CORS配置
    CORS_ORIGINS = ['*']

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    
class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    
# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}