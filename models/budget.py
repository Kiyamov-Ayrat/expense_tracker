from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date as Date


class BudgetBase(SQLModel):
    limit_amount: int = Field(default=None)
    # date: Date = Field(default_factory=Date.today,
    #                    index=True)
    year: int = Field(default=Date.today().year)
    month: int = Field(default=Date.today().month)

class Budget(BudgetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class BudgetUpdate(BudgetBase):
    limit_amount: int | None = None
    # date: Optional[Date] = None
    year: Optional[int] = None
    month: Optional[int] = None


class BudgetPublic(BudgetBase):
    pass

class BudgetCreate(BudgetBase):
    pass