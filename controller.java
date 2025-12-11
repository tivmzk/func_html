
/**
 * Class Name : |ALIAS||KEYWORD|Controller.java
 * Description : |DATA_NAME| 관리 컨트롤러
 * Modification Information
 *
 * 수정일 수정자 수정내용
 * ----------- ---------- ---------------------------
 * 2025.04.16. ojt 최초 생성
 *
 *
 * @author ojt
 * @created 2025.04.11.
 * @version 3.0
 */
@Controller
public class |ALIAS||KEYWORD|Controller {
	Logger log = Logger.getLogger(this.getClass());

	@Resource(name = "commonService")
	private CommonService commonService;
	@Resource(name = "globalsProperties")
	private Properties globalsProperties;
	@Resource(name = "commonFileService")
	CommonFileService commonFileService;
	
	/**
	 * |DATA_NAME| 시스템 리스트
	 *
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/select|KEYWORD|SmList.do")
	public String select|KEYWORD|SmList(HttpServletRequest request, HttpServletResponse response, ModelMap model, CommonMap commonMap) {
		
		// 관리 홈페이지 시스템 정보 호출
		Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
		
		// '관리자페이지-관리자페이지'의 경우 에서만 해당 매핑 주소 사용 가능
		if ( !SSmanageSysInfo.get("sysId").equals("apple") ) {
			return "redirect:/apple/|ALIAS_LOWER|/|KEYWORD2|/select|KEYWORD|List.do";
		}
		
		if (commonMap.get("pageIndex") == null) {
			commonMap.put("pageIndex", 20);
		}

		if (commonMap.get("pageIndex") == "") {
			commonMap.put("pageIndex", 20);
		}

		if ("".equals(commonMap.get("pageIndex"))) { // 만약 받아온 데이터가 공백이 아니면 데이터를 형변환 하여 적재
			commonMap.put("pageIndex", 20);
		}

		// 시스템 리스트 조회
		Map userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
		if(userInfo == null){
			return CommonUtil.alertException(response, "로그인이 필요합니다.");
		}

		try {

			// 관리자 권한체크
			if (CommonAuth.hasCombineAuth(userInfo)) {
				//최상위 기관 코드 조회
				Map bestInst = commonService.selectMap("sm_sys.selectBestInst", userInfo);
				commonMap = CommonUtil.getinstCode(commonMap, userInfo, bestInst);

			} else {
				model.addAttribute("returnUrl", "/apple/|ALIAS_LOWER|/|KEYWORD2|/select|KEYWORD|List.do");
				return "nfu/ap/am/returnUrl";
			}

			Map |KEYWORD2|SmListPaging = commonService.selectPageList("|NAMESPACE|.select|KEYWORD|SmList", commonMap.getMap(),
					Integer.parseInt(commonMap.get("pageIndex").toString()), request);
			model.addAttribute("|KEYWORD2|SmListPaging", |KEYWORD2|SmListPaging);
			model.addAttribute("commonMap", commonMap.getMap());

		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "select|KEYWORD|SmList");
		}

		model.addAttribute("content", "nfu/|PATH|/|ALIAS_LOWER|/|KEYWORD2|SmList.jsp");
		return CommonUtil.getSubLayoutPathBySysID("apple");
	}
	
	/**
	 * |DATA_NAME| 리스트
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/select|KEYWORD|List.do")
	public String select|KEYWORD|List(HttpServletRequest request, HttpServletResponse response, ModelMap model, CommonMap commonMap) {
		//사용자 정보 호출
		Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
		if(userInfo == null){
			return CommonUtil.alertException(response, "로그인이 필요합니다.");
		}
		//관리 시스템 리스트 호출
		List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

		// 접속한 관리자페이지 정보
		Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
		// 시스템 아이디 설정
		String sysId = "";

		if (commonMap.get("sysId") != null) {
			sysId = Objects.toString(commonMap.get("sysId"), "");
		} else {
			sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
		}

		//시스템 아이디 설정
		commonMap.put("sysId", sysId);

		try {
			//권한체크
			if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList) ) {
				return CommonUtil.alertException(response, "유효하지 않은 요청입니다.");
			}
			
			if(commonMap.get("pageIndex") == null) {
				commonMap.put("pageIndex", 10);
			}
			
			// |DATA_NAME| 리스트 조회
			Map |KEYWORD2|ListPaging = commonService.selectPageList("|NAMESPACE|.select|KEYWORD|List", commonMap.getMap(), Integer.parseInt(Objects.toString(commonMap.get("pageIndex"))), request);
			model.addAttribute("|KEYWORD2|ListPaging", |KEYWORD2|ListPaging);
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "select|KEYWORD|List");
		}

		model.addAttribute("commonMap", commonMap.getMap());
		model.addAttribute("content", "nfu/|PATH|/|ALIAS_LOWER|/|KEYWORD2|List.jsp");
		return CommonUtil.getSubLayoutPathBySysID("apple");
	}
	
	/**
	 * |DATA_NAME| 단건 조회 페이지
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/select|KEYWORD|Info.do")
	public String select|KEYWORD|Info(HttpServletRequest request, HttpServletResponse response, ModelMap model, CommonMap commonMap) {
		//사용자 정보 호출
		Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
		if(userInfo == null){
			return CommonUtil.alertException(response, "로그인이 필요합니다.");
		}
		//관리 시스템 리스트 호출
		List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

		// 접속한 관리자페이지 정보
		Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
		// 시스템 아이디 설정
		String sysId = "";

		if (commonMap.get("sysId") != null) {
			sysId = Objects.toString(commonMap.get("sysId"), "");
		} else {
			sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
		}

		//시스템 아이디 설정
		commonMap.put("sysId", sysId);
		//권한체크
		if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList) ) {
			return CommonUtil.alertException(response, "유효하지 않은 요청입니다.");
		}
		
		try {
			Map |KEYWORD2|Info = commonService.selectMap("|NAMESPACE|.select|KEYWORD|Info", commonMap.getMap());
			model.addAttribute("|KEYWORD2|Info", |KEYWORD2|Info);
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "select|KEYWORD|InfoPage");
		}
		

		model.addAttribute("commonMap", commonMap.getMap());
		model.addAttribute("content", "nfu/|PATH|/|ALIAS_LOWER|/|KEYWORD2|Info.jsp");
		return CommonUtil.getSubLayoutPathBySysID("apple");
	}
	
	/**
	 * |DATA_NAME| 등록 페이지
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/insert|KEYWORD|InfoPage.do")
	public String insert|KEYWORD|InfoPage(HttpServletRequest request, HttpServletResponse response, ModelMap model, CommonMap commonMap) {
		//사용자 정보 호출
		Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
		if(userInfo == null){
			return CommonUtil.alertException(response, "로그인이 필요합니다.");
		}
		//관리 시스템 리스트 호출
		List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

		// 접속한 관리자페이지 정보
		Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
		// 시스템 아이디 설정
		String sysId = "";

		if (commonMap.get("sysId") != null) {
			sysId = Objects.toString(commonMap.get("sysId"), "");
		} else {
			sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
		}

		//시스템 아이디 설정
		commonMap.put("sysId", sysId);
		//권한체크
		if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList) ) {
			return CommonUtil.alertException(response, "유효하지 않은 요청입니다.");
		}
		try {
		}
		catch(SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "insert|KEYWORD|InfoPage");
		}
		
		model.addAttribute("commonMap", commonMap.getMap());
		model.addAttribute("content", "nfu/|PATH|/|ALIAS_LOWER|/|KEYWORD2|Insert.jsp");
		return CommonUtil.getSubLayoutPathBySysID("apple");
	}
	
	/**
	 * |DATA_NAME| 등록
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/insert|KEYWORD|Info.do")
	public void insert|KEYWORD|Info(HttpServletRequest request, HttpServletResponse response, CommonMap commonMap, ModelMap model) {
		Map<String, Object> resultMap = new HashMap<>(); 
		try {
			//사용자 정보 호출
			Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
			if(userInfo == null){
				resultMap.put("resultAt", "A");
				return;
			}
			//관리 시스템 리스트 호출
			List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

			// 접속한 관리자페이지 정보
			Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
			// 시스템 아이디 설정
			String sysId = "";

			if (commonMap.get("sysId") != null) {
				sysId = Objects.toString(commonMap.get("sysId"), "");
			} else {
				sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
			}

			//시스템 아이디 설정
			commonMap.put("sysId", sysId);

			// 권한 체크
			if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList)) {
				// ajax 결과값 설정
				resultMap.put("resultAt", "A");
				return;
			}
			// |DATA_NAME| 입력
			commonService.insertQuery("|NAMESPACE|.insert|KEYWORD|Info", commonMap.getMap());

			// ajax 결과값 설정
			resultMap.put("resultAt", "Y");
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "insert|KEYWORD|Info");
		} finally {
			PrintWriter out = null;
			Gson gson = new Gson();
			String json = gson.toJson(resultMap);

			try {
				response.setCharacterEncoding("utf-8");
				out = response.getWriter();
				out.print(json);
			} catch (IOException e) {
				CommonLog.debug(e, this.getClass(), "insert|KEYWORD|Info");
			} finally {
				if (out != null) {
					out.flush();
					out.close();
				}
			}
		}
	}
	
	/**
	 * |DATA_NAME| 수정 페이지
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/update|KEYWORD|InfoPage.do")
	public String update|KEYWORD|InfoPage(HttpServletRequest request, HttpServletResponse response, ModelMap model, CommonMap commonMap) {
		//사용자 정보 호출
		Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
		if(userInfo == null){
			return CommonUtil.alertException(response, "로그인이 필요합니다.");
		}
		//관리 시스템 리스트 호출
		List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

		// 접속한 관리자페이지 정보
		Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
		// 시스템 아이디 설정
		String sysId = "";

		if (commonMap.get("sysId") != null) {
			sysId = Objects.toString(commonMap.get("sysId"), "");
		} else {
			sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
		}

		//시스템 아이디 설정
		commonMap.put("sysId", sysId);
		//권한체크
		if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList) ) {
			return CommonUtil.alertException(response, "유효하지 않은 요청입니다.");
		}
		
		try {
			Map |KEYWORD2|Info = commonService.selectMap("|NAMESPACE|.select|KEYWORD|Info", commonMap.getMap());
			model.addAttribute("|KEYWORD2|Info", |KEYWORD2|Info);
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "update|KEYWORD|InfoPage");
		}
		

		model.addAttribute("commonMap", commonMap.getMap());
		model.addAttribute("content", "nfu/|PATH|/|ALIAS_LOWER|/|KEYWORD2|Update.jsp");
		return CommonUtil.getSubLayoutPathBySysID("apple");
	}
	
	/**
	 * |DATA_NAME| 수정
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/update|KEYWORD|Info.do")
	public void update|KEYWORD|Info(HttpServletRequest request, HttpServletResponse response, CommonMap commonMap, ModelMap model) {
		Map<String, Object> resultMap = new HashMap<>(); 
		try {
			//사용자 정보 호출
			Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
			if(userInfo == null){
				resultMap.put("resultAt", "A");
				return;
			}
			//관리 시스템 리스트 호출
			List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

			// 접속한 관리자페이지 정보
			Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
			// 시스템 아이디 설정
			String sysId = "";

			if (commonMap.get("sysId") != null) {
				sysId = Objects.toString(commonMap.get("sysId"), "");
			} else {
				sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
			}

			//시스템 아이디 설정
			commonMap.put("sysId", sysId);

			// 권한 체크
			if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList)) {
				// ajax 결과값 설정
				resultMap.put("resultAt", "A");
				return;
			}
			// |DATA_NAME| 수정
			commonService.updateQuery("|NAMESPACE|.update|KEYWORD|Info", commonMap.getMap());

			// ajax 결과값 설정
			resultMap.put("resultAt", "Y");
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "update|KEYWORD|Info");
		} finally {
			PrintWriter out = null;
			Gson gson = new Gson();
			String json = gson.toJson(resultMap);

			try {
				response.setCharacterEncoding("utf-8");
				out = response.getWriter();
				out.print(json);
			} catch (IOException e) {
				CommonLog.debug(e, this.getClass(), "update|KEYWORD|Info");
			} finally {
				if (out != null) {
					out.flush();
					out.close();
				}
			}
		}
	}
	
	/**
	 * |DATA_NAME| 삭제
	 * 
	 * @param request
	 * @param model
	 * @param commonMap
	 * @return
	 */
	@RequestMapping("/apple/|ALIAS_LOWER|/|KEYWORD2|/delete|KEYWORD|Info.do")
	public void delete|KEYWORD|Info(HttpServletRequest request, HttpServletResponse response, CommonMap commonMap, ModelMap model) {
		Map<String, Object> resultMap = new HashMap<>(); 
		try {
			//사용자 정보 호출
			Map<String, Object> userInfo = SystemSessionInfo.getSessionUserInfo(request, "apple");
			if(userInfo == null){
				resultMap.put("resultAt", "A");
				return;
			}
			//관리 시스템 리스트 호출
			List<Map<String, Object>> manageList = (List<Map<String, Object>>) SystemSessionInfo.getSessionInfo(request, userInfo.get("mbrId")+"_manageSysList");

			// 접속한 관리자페이지 정보
			Map<String, Object> SSmanageSysInfo = (Map<String, Object>) SystemSessionInfo.getSessionInfo(request, "SSmanageSysInfo");
			// 시스템 아이디 설정
			String sysId = "";

			if (commonMap.get("sysId") != null) {
				sysId = Objects.toString(commonMap.get("sysId"), "");
			} else {
				sysId = Objects.toString(SSmanageSysInfo.get("sysId"), "");
			}

			//시스템 아이디 설정
			commonMap.put("sysId", sysId);

			// 권한 체크
			if (!CommonAuth.hasAuthForCrud(userInfo, sysId, manageList)) {
				// ajax 결과값 설정
				resultMap.put("resultAt", "A");
				return;
			}
			
			Map |KEYWORD2|Info = commonService.selectMap("|NAMESPACE|.select|KEYWORD|Info", commonMap.getMap());
			if(|KEYWORD2|Info == null) {
				resultMap.put("resultAt", "N");
				return;
			}
			
			// |DATA_NAME| 삭제
			commonService.deleteQuery("|NAMESPACE|.delete|KEYWORD|Info", commonMap.getMap());

			// ajax 결과값 설정
			resultMap.put("resultAt", "Y");
		} catch (SQLException | IOException e) {
			CommonLog.debug(e, this.getClass(), "delete|KEYWORD|Info");
		} finally {
			PrintWriter out = null;
			Gson gson = new Gson();
			String json = gson.toJson(resultMap);

			try {
				response.setCharacterEncoding("utf-8");
				out = response.getWriter();
				out.print(json);
			} catch (IOException e) {
				CommonLog.debug(e, this.getClass(), "delete|KEYWORD|Info");
			} finally {
				if (out != null) {
					out.flush();
					out.close();
				}
			}
		}
	}
}
