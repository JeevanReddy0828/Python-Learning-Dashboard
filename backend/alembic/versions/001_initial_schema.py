"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(50), server_default='📚'),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('is_published', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )
    op.create_index('ix_modules_slug', 'modules', ['slug'])

    op.create_table(
        'lessons',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('module_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('eli5_summary', sa.Text(), nullable=False),
        sa.Column('content_html', sa.Text(), nullable=False),
        sa.Column('analogy', sa.Text(), nullable=False),
        sa.Column('diagram_data', postgresql.JSONB(), nullable=True),
        sa.Column('estimated_min', sa.Integer(), server_default='5'),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('xp_reward', sa.Integer(), server_default='10'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lessons_module_id', 'lessons', ['module_id'])

    op.create_table(
        'exercises',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('solution_code', sa.Text(), nullable=True),
        sa.Column('test_cases', postgresql.JSONB(), nullable=True),
        sa.Column('hints', postgresql.JSONB(), nullable=True),
        sa.Column('options', postgresql.JSONB(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('xp_reward', sa.Integer(), server_default='20'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_exercises_lesson_id', 'exercises', ['lesson_id'])

    op.create_table(
        'user_lesson_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), server_default='not_started'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('time_spent_sec', sa.Integer(), server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'lesson_id'),
    )

    op.create_table(
        'user_exercise_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), server_default='not_started'),
        sa.Column('attempts', sa.Integer(), server_default='0'),
        sa.Column('best_score', sa.Integer(), server_default='0'),
        sa.Column('xp_awarded', sa.Integer(), server_default='0'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'exercise_id'),
    )

    op.create_table(
        'achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(100), server_default='🏆'),
        sa.Column('xp_reward', sa.Integer(), server_default='50'),
        sa.Column('trigger_type', sa.String(50), nullable=False),
        sa.Column('trigger_value', sa.Integer(), server_default='1'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )
    op.create_index('ix_achievements_slug', 'achievements', ['slug'])

    op.create_table(
        'user_achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'achievement_id'),
    )

    op.create_table(
        'streaks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('current_streak', sa.Integer(), server_default='0'),
        sa.Column('longest_streak', sa.Integer(), server_default='0'),
        sa.Column('last_activity', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'code_submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(20), server_default='python'),
        sa.Column('stdout', sa.Text(), nullable=True),
        sa.Column('stderr', sa.Text(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('code_submissions')
    op.drop_table('streaks')
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    op.drop_table('user_exercise_progress')
    op.drop_table('user_lesson_progress')
    op.drop_table('exercises')
    op.drop_table('lessons')
    op.drop_table('modules')
    op.drop_table('users')
