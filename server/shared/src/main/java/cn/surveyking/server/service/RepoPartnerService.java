package cn.surveyking.server.service;

import cn.surveyking.server.core.common.PaginationResponse;
import cn.surveyking.server.domain.dto.RepoPartnerQuery;
import cn.surveyking.server.domain.dto.RepoPartnerRequest;
import cn.surveyking.server.domain.dto.RepoPartnerView;

public interface RepoPartnerService {

	PaginationResponse<RepoPartnerView> listRepoPartner(RepoPartnerQuery query);

	void addRepoPartner(RepoPartnerRequest request);

	void deleteRepoPartner(RepoPartnerRequest request);

	boolean hasPracticePermission(String repoId, String userId);
}
