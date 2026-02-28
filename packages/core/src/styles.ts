export const STYLES = `
:root { --zhihu-ai-primary-color: #667eea; --zhihu-ai-secondary-color: #764ba2; }
.Question-sideColumn--sticky { display: none !important; }
.zhihu-ai-side-panel { left: 100%; margin-left: 30px; width: 400px; z-index: 1; background: white; border-radius: 8px; box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1); transition: opacity 0.3s ease; }
.zhihu-ai-side-panel.short { position: absolute; top: 0; height: 15vh; overflow-y: auto; }
.zhihu-ai-side-panel.long { position: absolute; top: -15px; max-height: calc(100vh - 90px); overflow-y: auto; }
.zhihu-ai-side-panel.question-fixed { position: fixed; top: 135px; right: auto; left: 65%; margin-left: 0; max-height: calc(100vh - 120px); overflow-y: auto; z-index: 1; }
.zhihu-ai-summary-btn { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; margin-right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); flex-shrink: 0; }
.zhihu-ai-summary-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.zhihu-ai-summary-btn:active { transform: translateY(0); }
.zhihu-ai-summary-btn.loading { opacity: 0.7; cursor: wait; }
.zhihu-ai-summary-btn .icon { width: 16px; height: 16px; }
.zhihu-ai-summary-btn-question { flex-shrink: 0; align-self: flex-start; margin-top: 15px; }
.zhihu-ai-summary-btn-answer { margin-left: 8px !important; margin-right: 0; padding: 4px 12px; font-size: 13px; border-radius: 16px; display: inline-flex; vertical-align: middle; }
.zhihu-ai-answer-result { padding: 5px; background: white; overflow-y: auto; }
.zhihu-ai-answer-result-header { display: flex; align-items: center; gap: 6px; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0; font-size: 15px; font-weight: 600; color: #667eea; }
.zhihu-ai-answer-result-body { line-height: 1.8; color: #555; font-size: 14px; }
.zhihu-ai-answer-result-close { margin-left: auto; background: none; border: none; color: #999; cursor: pointer; font-size: 20px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s; }
.zhihu-ai-answer-result-close:hover { background: rgba(0, 0, 0, 0.05); color: #666; }
.zhihu-ai-result-actions { display: flex; gap: 4px; margin-left: auto; }
.zhihu-ai-result-copy { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; transition: all 0.2s; }
.zhihu-ai-result-copy:hover { background: rgba(0, 0, 0, 0.05); }
.zhihu-ai-streaming-cursor { display: inline-block; width: 2px; height: 1em; background: #667eea; margin-left: 2px; animation: blink 1s infinite; vertical-align: text-bottom; }
@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
.zhihu-ai-config-btn { position: fixed; bottom: 60px; right: 10px; width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 24px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); z-index: 9999; transition: all 0.3s ease; }
.zhihu-ai-config-btn:hover { transform: scale(1.1); }
.zhihu-ai-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.zhihu-ai-modal-content { background: white; border-radius: 12px; padding: 24px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); animation: slideUp 0.3s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.zhihu-ai-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f0f0f0; }
.zhihu-ai-modal-title { font-size: 20px; font-weight: 600; color: #333; }
.zhihu-ai-modal-close { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
.zhihu-ai-config-label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.zhihu-ai-config-input { width: 100%; padding: 10px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; }
.zhihu-ai-config-save { width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; }
`;
