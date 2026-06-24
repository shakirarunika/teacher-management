<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Batasi query hanya pada data milik guru yang sedang login.
 * Admin (dan konteks tanpa login: CLI, queue, seeder) melihat semua data.
 */
class OwnerScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && $user->role === 'teacher') {
            $builder->where(
                $model->getTable() . '.' . $model->ownerColumn(),
                $user->id
            );
        }
    }
}
