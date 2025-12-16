from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from typing import Optional, Annotated
from fastapi.params import Query, Depends
from enum import Enum


class Category(str, Enum):
    product = "product"
    transport = "transport"
    cafe = "cafe"
    internet = "internet"
    clothes = "clothes"
    education = "education"
    home = "home"
    tax = "tax"
    other = "other"

class ExpenseBase(SQLModel):
    description: str | None = Field(default=None, max_length=300)
    amount: int
    category: Category = Field(default=Category.other, index=True)


class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class ExpenseCreate(ExpenseBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "description": "Buy bread",
                    "amount": 100,
                    "category": Category.product,
                }
            ]
        }
    }
    pass

class ExpensePublic(ExpenseBase):
    id: int
    amount: int
    category: Category


class ExpenseUpdate(ExpenseBase):
    description: Optional[str] = None
    amount: int | None = None
    category: Category | None = None

class Pagination(BaseModel):
    offset: int
    limit: int

def pagination_params(
        offset: int = Query(0, ge=0, description="min list of task"),
        limit: int = Query(10, ge=10, description="max list of task"),
) -> Pagination:
    return Pagination(offset=offset, limit=limit)

PaginationDep = Annotated[Pagination, Depends(pagination_params)]
