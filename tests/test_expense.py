from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from database.database import get_session
from main import app
from models.expense import Expense

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_create_expense(client: TestClient):

    response = client.post("/expenses/", json={
        "description": "bread",
        "amount": 45,
        "category": "product",
        "date": "2025-12-25"
    })

    data = response.json()

    assert response.status_code == 201
    assert data["id"] == 1
    assert data["description"] == "bread"
    assert data["amount"] == 45
    assert data["category"] == "product"
    assert data["date"] == "2025-12-25"

def test_read_expenses(session: Session, client: TestClient):
    exp = Expense(description="bread",
                  amount=45,
                  category="product", date=date.today())
    session.add(exp)
    session.commit()

    response = client.get(f"/expenses/{exp.id}")
    data = response.json()
    assert response.status_code == 200
    assert data["id"] == exp.id
    assert data["description"] == "bread"
    assert data["amount"] == 45
    assert data["category"] == "product"

def test_update_expense(session: Session, client: TestClient):
    exp = Expense(description="bread",
                  amount=45,
                  category="product", date=date.today())
    session.add(exp)
    session.commit()

    response = client.patch(f"/expenses/{exp.id}",
                            json={"description": "apple",})
    data = response.json()

    assert response.status_code == 200
    assert data["id"] == exp.id
    assert data["description"] == "apple"
    assert data["amount"] == 45
    assert data["category"] == "product"

def test_delete_expense(session: Session, client: TestClient):
    exp = Expense(description="bread",
                  amount=45,
                  category="product", date=date.today())
    session.add(exp)
    session.commit()

    response = client.delete(f"/expenses/{exp.id}")
    exp_in_db = session.get(Expense, exp.id)

    assert response.status_code == 200
    assert response.json() == {"Ok": True}