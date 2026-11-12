import { Icon } from "./ui";

export default function FriendsPanel() {
  return (
    <section className="friends-panel" aria-label="Друзья">
      <div className="friends-heading">
        <div>
          <Icon name="people" className="h-4 w-4" />
          <h2>Друзья</h2>
        </div>
      </div>
      <div className="px-5 py-6 text-center">
        <p className="text-sm font-medium">Пока играем в одиночку</p>
        <p className="mt-2 text-xs leading-6 text-muted">
          Подключение друзей и их статус в сети пока недоступны.
          Вы можете пройти историю самостоятельно.
        </p>
      </div>
    </section>
  );
}
