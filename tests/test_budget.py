import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from datetime import datetime, date
from sqlmodel.pool import StaticPool

from main import app
from database.database import get_session
from models.budget import Budget
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

def test_create_budget(client: TestClient):
    client = TestClient(app)

    response = client.post("/budget",
                           json={
                               "limit_amount": 1000,
                               "year": datetime.now().year,
                               "month": datetime.now().month
                           })
    data = response.json()

    assert response.status_code == 200
    assert data["limit_amount"] == 1000
    assert data["year"] == datetime.now().year
    assert data["month"] == datetime.now().month

def test_budget_status(session: Session, client: TestClient):
    budg = Budget(limit_amount=1000,
                year=datetime.now().year,
                month=datetime.now().month)
    exp = Expense(description="bread",
                  amount=100,
                  category="product", date=date.today())
    session.add(budg)
    session.add(exp)
    session.commit()

    response = client.get(f"/budget/{budg.year}/{budg.month}")

    data = response.json()
    assert response.status_code == 200
    assert data["balance"] == 900
    assert data["spent"] == 100
    assert data["planed_budget"] == budg.limit_amount
    assert data["is_over_limit"] == False
    assert data["status"] == "success"
    assert data["message"] == f"Budget is 900"

def test_budget_update(session: Session, client: TestClient):
    budg = Budget(limit_amount=1000,
                year=datetime.now().year,
                month=datetime.now().month)
    session.add(budg)
    session.commit()

    response = client.patch(f"/budget/{budg.id}",
                            json={"limit_amount": 800})
    data = response.json()

    assert response.status_code == 200
    assert data["limit_amount"] == 800
    assert data["year"] == datetime.now().year
    assert data["month"] == datetime.now().month

def test_budget_delete(session: Session, client: TestClient):
    budg = Budget(limit_amount=1000,
                year=datetime.now().year,
                month=datetime.now().month)
    session.add(budg)
    session.commit()

    response = client.delete(f"/budget/{budg.id}")
    budg_in_db = session.get(Budget, budg.id)
    assert response.status_code == 200
    assert response.json() == {"Ok": True}
    assert budg_in_db is None