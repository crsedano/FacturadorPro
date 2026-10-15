<?php

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Resources\Json\ResourceCollection;

class PaymentMethodTypeCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function toArray($request)
    {
        return $this->collection->transform(function($row, $key) {
            $row = $row instanceof \Illuminate\Http\Resources\Json\JsonResource ? $row->resource : $row;
            return [
                'id' => $row->id,
                'active' => ($row->active)?'Si':'No',
                'description' => $row->description,
            ];
        });
    }
}
