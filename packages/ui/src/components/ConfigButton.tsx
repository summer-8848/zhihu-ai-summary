// No imports needed with JSX transform

interface ConfigButtonProps {
  onClick: () => void;
}

export function ConfigButton({ onClick }: ConfigButtonProps) {
  return (
    <button className="zhihu-ai-config-btn" onClick={onClick} title="配置">
      ⚙️
    </button>
  );
}
