<?php

namespace Modules\Suscription\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class SectionCollection extends ResourceCollection
{

    /**
     * Transform the resource collection into an array.
     *
     * @param Request $request
     *
     * @return array
     */
    public function toArray($request)
    {
        return $this->collection->transform(function ($row, $key) {
            $row = $row instanceof \Illuminate\Http\Resources\Json\JsonResource ? $row->resource : $row;
            return $row->getRowResource();
        });

    }

}
