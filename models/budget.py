from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class BudgetBase(SQLModel):
    limit_amount: int = Field(default=None)
    month: int = Field(default_factory=lambda: datetime.now().month)

class Budget(BudgetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class BudgetUpdate(BudgetBase):
    limit_amount: int | None = None
    month: int | None = None

class BudgetPublic(BudgetBase):
    pass

class BudgetCreate(BudgetBase):
    pass