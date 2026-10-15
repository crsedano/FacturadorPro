<?php

namespace App\Http\Middleware;

use Closure;
use Stancl\Tenancy\Resolvers\DomainTenantResolver;
use Stancl\Tenancy\Tenancy;
use Stancl\Tenancy\Contracts\TenantCouldNotBeIdentifiedException;

class InitializeTenancyIfTenantDomain
{
    protected $tenancy;
    protected $resolver;

    public function __construct(Tenancy $tenancy, DomainTenantResolver $resolver)
    {
        $this->tenancy = $tenancy;
        $this->resolver = $resolver;
    }

    public function handle($request, Closure $next)
    {
        try {
            $tenant = $this->resolver->resolve($request->getHost());
            $this->tenancy->initialize($tenant);
        } catch (TenantCouldNotBeIdentifiedException $e) {
            // Not a tenant domain — pass through silently
        }

        return $next($request);
    }
}
