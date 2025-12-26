import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from datetime import date, datetime
from io import StringIO
import csv

from main import app
from database.database import get_session
from models.expense import Expense, Category
from models.budget import Budget

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
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

def test_get_product(session: Session, client: TestClient):
    expense = Expense(description="bread",
                  amount=45,
                  category=Category.product, date=date.today())
    session.add(expense)
    session.commit()

    response = client.get(f"/filter/{expense.category.value}")
    data = response.json()

    assert response.status_code == 200
    assert data[0]["description"] == "bread"
    assert data[0]["amount"] == 45
    assert data[0]["category"] == Category.product
    assert data[0]["date"] == f"{date.today()}"

def test_get_by_month(session: Session, client: TestClient):
    expense = Expense(description="bread",
                  amount=45,
                  category=Category.product,
                    date=date.today())
    session.add(expense)
    session.commit()

    response = client.get(f"/filter/{expense.date.year}/"
                          f"{expense.date.month}")
    data = response.json()

    assert response.status_code == 200
    assert data[0]["description"] == "bread"
    assert data[0]["amount"] == 45
    assert data[0]["category"] == Category.product
    assert data[0]["date"] == f"{date.today()}"
    assert data[0]["id"] == 1

def test_get_statistic_by_month(session: Session, client: TestClient):
    expense = Expense(description="bread",
                  amount=45,
                  category=Category.product,
                    date=date.today())
    session.add(expense)
    session.commit()

    response = client.get(f"filter/statistic/"
                          f"{expense.date.year}/"
                          f"{expense.date.month}")
    data = response.json()

    assert response.status_code == 200
    assert data["product"] == 45

def test_csv_statistic(session: Session, client: TestClient):
    expense = Expense(description="bread",
                  amount=45,
                  category=Category.product,
                    date=date.today())
    budget = Budget(limit_amount=1000,
                year=datetime.now().year,
                month=datetime.now().month)

    session.add(expense)
    session.add(budget)
    session.commit()

    response = client.get(f"filter/csv_statistic/"
                          f"{expense.date.year}/"
                          f"{expense.date.month}")
    data = response.text
    reader = csv.reader(StringIO(data), delimiter=";")
    rows = list(reader)

    assert response.status_code == 200
    assert rows[0] == ["Category", "Amount"]

def test_get_data_by_date_category(session: Session,
                                   client: TestClient):
    expense = Expense(description="bread",
                  amount=45,
                  category=Category.product,
                    date=date.today())
    session.add(expense)
    session.commit()

    response = client.get(f"filter/"
                          f"{expense.date.year}/"
                          f"{expense.date.month}/"
                          f"{expense.category.value}")
    data = response.json()
    assert response.status_code == 200
    assert data[0]["description"] == "bread"
    assert data[0]["amount"] == 45
    assert data[0]["category"] == Category.product
    assert data[0]["date"] == f"{date.today()}"
    assert data[0]["id"] == 1