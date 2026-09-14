<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'contact_person', 'phone', 'email', 'address'];

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    public function stockIns()
    {
        return $this->hasMany(StockIn::class);
    }
}
