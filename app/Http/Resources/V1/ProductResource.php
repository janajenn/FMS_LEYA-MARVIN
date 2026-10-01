<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'slug'            => $this->slug ?? null,
            'description'     => $this->description,
            'price'           => (float) $this->price,
            'stock_quantity'  => (int) $this->stock_quantity,
            'is_customizable' => (bool) $this->is_customizable,
            'labor_cost'      => (float) ($this->labor_cost ?? 0),

            // ─── Product-level standard dimensions ───
            'standard_length'    => $this->standard_length    !== null ? (float) $this->standard_length    : null,
            'standard_width'     => $this->standard_width     !== null ? (float) $this->standard_width     : null,
            'standard_height'    => $this->standard_height    !== null ? (float) $this->standard_height    : null,
            'standard_thickness' => $this->standard_thickness !== null ? (float) $this->standard_thickness : null,
            'standard_diameter'  => $this->standard_diameter  !== null ? (float) $this->standard_diameter  : null,
            'standard_depth'     => $this->standard_depth     !== null ? (float) $this->standard_depth     : null,

            'category' => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),

            'images' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($img) => [
                    'id'         => $img->id,
                    'url'        => asset('storage/' . $img->path),
                    'is_primary' => (bool) $img->is_primary,
                    'sort_order' => (int) $img->sort_order,
                ])
            ),

            'variants' => $this->whenLoaded('variants', fn () =>
                $this->variants->map(fn ($v) => [
                    'id'          => $v->id,
                    'name'        => $v->name,
                    'slug'        => $v->slug,
                    'price'       => (float) $v->price,
                    'description' => $v->description,
                    'is_active'   => (bool) $v->is_active,
                    'sort_order'  => (int) $v->sort_order,
                    'images'      => $v->relationLoaded('images')
                        ? $v->images->map(fn ($img) => [
                            'id'  => $img->id,
                            'url' => asset('storage/' . $img->path),
                        ])
                        : [],
                ])
            ),

            'parts' => $this->whenLoaded('parts', fn () =>
                $this->parts->map(fn ($p) => [
                    'id'                 => $p->id,
                    'name'               => $p->name,
                    'reference_image'    => $p->reference_image,
                    'dimension_fields'   => $p->dimension_fields ?? [],
                    'sort_order'         => (int) $p->sort_order,
                    'standard_length'    => $p->standard_length    !== null ? (float) $p->standard_length    : null,
                    'standard_width'     => $p->standard_width     !== null ? (float) $p->standard_width     : null,
                    'standard_height'    => $p->standard_height    !== null ? (float) $p->standard_height    : null,
                    'standard_thickness' => $p->standard_thickness !== null ? (float) $p->standard_thickness : null,
                    'standard_diameter'  => $p->standard_diameter  !== null ? (float) $p->standard_diameter  : null,
                    'standard_depth'     => $p->standard_depth     !== null ? (float) $p->standard_depth     : null,
                ])
            ),

            'finishes' => $this->whenLoaded('finishes', fn () =>
                $this->finishes->map(fn ($f) => [
                    'id'   => $f->id,
                    'name' => $f->name,
                ])
            ),
        ];
    }
}
