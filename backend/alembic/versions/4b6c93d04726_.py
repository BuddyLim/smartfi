"""empty message

Revision ID: 4b6c93d04726
Revises: 84e862395786
Create Date: 2025-03-16 21:28:47.653983

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b6c93d04726'
down_revision: Union[str, None] = '84e862395786'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('transaction', schema=None) as batch_op:
        batch_op.add_column(sa.Column('category_name', sa.String(length=30), nullable=False))
        batch_op.add_column(sa.Column('amount', sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column('date', sa.String(length=30), nullable=False))

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('transaction', schema=None) as batch_op:
        batch_op.drop_column('date')
        batch_op.drop_column('amount')
        batch_op.drop_column('category_name')

    # ### end Alembic commands ###
