// No imports needed with JSX transform

interface ConfigButtonProps {
  onClick: () => void;
  autoHide?: boolean;
}

export function ConfigButton({ onClick, autoHide = false }: ConfigButtonProps) {
  return (
    <div className={`zhihu-ai-config-btn-wrapper${autoHide ? ' auto-hide' : ''}`}>
      <button className="zhihu-ai-config-btn" onClick={onClick} title="配置">
        ⚙️
      </button>
    </div>
  );
}
