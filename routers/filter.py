from fastapi import APIRouter, Path
from models.expense import ExpensePublic, Category
from database.database import SessionDep
from func import filter
from typing import Annotated

router = APIRouter()

@router.get("/filter/{category}",
            response_model=list[ExpensePublic],
            tags=["filter"])
def read_category(session: SessionDep, category: Category):
    return filter.get_product(session=session, category=category)

@router.get("/filter/{year}/{month}",
            response_model=list[ExpensePublic],
            tags=["filter"])
def get_month(session: SessionDep,
              year: Annotated[int, Path(ge=2025, le=2100)],
              month: Annotated[int, Path(ge=1, le=12)]):
    return filter.get_by_month(session=session, year=year, month=month)

@router.get("/filter/statistic/{year}/{month}",
            tags=["filter"])
def get_expense_statistic(session: SessionDep,
                          year: Annotated[int, Path(ge=2025, le=2100)],
                          month: Annotated[int, Path(ge=1, le=12)]
                          ):
    return filter.statistic_month(session=session, year=year, month=month)


@router.get("/filter/csv_statistic/{year}/{month}",
            tags=["filter"])
def get_csv_statistic(session: SessionDep,
                      year: Annotated[int, Path(ge=2025, le=2100)],
                      month: Annotated[int, Path(ge=1, le=12)]):
    return filter.csv_statistic(session=session, year=year, month=month)

@router.get("/filter/{year}/{month}/{category}",
            tags=["filter"])
def get_data_by_date_category(session: SessionDep,
                              year: Annotated[int, Path(ge=2025, le=2100)],
                              month: Annotated[int, Path(ge=1, le=12)],
                              category: Category):
    return filter.filter_date_category(session=session,
                                       year=year,
                                       month=month,
                                       category=category)