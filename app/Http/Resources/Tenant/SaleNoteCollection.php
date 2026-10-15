<?php

    namespace App\Http\Resources\Tenant;

    use App\Models\Tenant\Configuration;
    use Illuminate\Http\Resources\Json\ResourceCollection;
    use App\Models\Tenant\Person;
    /**
     * Class SaleNoteCollection
     *
     * @package App\Http\Resources\Tenant
     */
    class SaleNoteCollection extends ResourceCollection {
        /**
         * Transform the resource collection into an array.
         *
         * @param \Illuminate\Http\Request $request
         *
         * @return array|\Illuminate\Support\Collection
         */
        public function toArray($request) {
            $configuration = Configuration::first();
            return $this->collection->transform(function ($row, $key) use($configuration) {
                $row = $row instanceof \Illuminate\Http\Resources\Json\JsonResource ? $row->resource : $row;
                /** @var \App\Models\Tenant\SaleNote $row */
                return $row->getCollectionData($configuration);
            });
        }

    }
