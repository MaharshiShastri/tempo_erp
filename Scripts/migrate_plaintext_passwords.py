from database.repository import SessionLocal
from database.models import User
from security import hash_password

def looks_like_argon2_hash(value: str) -> bool:
    return value.startswith(("$argon2id$", "$argon2i$", "$argon2d$",))

def migrate_passwords():
    migrated = 0
    skipped = 0

    with SessionLocal() as session:
        users = session.query(User).all()

        print(f"Found {len(users)} Users.")

        for user in users:
            if not user.password_hash:
                print(f'[SKIP] {user.email}: empty password')

                skipped += 1
                continue

            if looks_like_argon2_hash(user.password_hash):
                print(f"[SKIP] {user.email}: already hashed")

                skipped += 1
                continue

            plaintext_password = user.password_hash
            print("Plaintext is: ", plaintext_password)
            user.password_hash = hash_password(plaintext_password)

            migrated += 1
            print(f"[MIGRATED] {user.email}")

        session.commit()

        print("================================")
        print("Password migration completed")
        print("================================")
        print(f"Migrated: {migrated}")
        print(f"Skipped: {skipped}")

if __name__=="__main__":
    migrate_passwords()