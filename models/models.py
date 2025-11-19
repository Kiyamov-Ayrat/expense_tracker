from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from typing import Optional, Annotated
from fastapi.params import Query, Depends

class ExpenseBase(SQLModel):
    description: str | None = Field(default=None)
    amount: int
    category: str


class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class ExpenseCreate(ExpenseBase):
    pass

class ExpensePublic(ExpenseBase):
    id: int


class ExpenseUpdate(SQLModel):
    description: str | None = None
    amount: int | None = None
    category: str | None = None

class Pagination(BaseModel):
    offset: int
    limit: int

def pagination_params(
        offset: int = Query(0, ge=0, description="min list of task"),
        limit: int = Query(10, ge=10, description="max list of task"),
) -> Pagination:
    return Pagination(offset=offset, limit=limit)

PaginationDep = Annotated[Pagination, Depends(pagination_params)]
